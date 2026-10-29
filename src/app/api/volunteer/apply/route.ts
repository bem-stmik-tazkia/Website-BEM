import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/auth";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Allowlist root domain untuk lampiran dokumen (exact match atau endsWith('.' + domain))
const ALLOWED_ROOT_DOMAINS = [
  "drive.google.com",
  "docs.google.com",
  "notion.so",
  "notion.site",
  "github.com",
  "linkedin.com",
  "figma.com",
  "canva.com",
  "onedrive.live.com",
  "1drv.ms",
];

export function isHostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_ROOT_DOMAINS.some(
    (domain) => host === domain || host.endsWith("." + domain)
  );
}

function isAllowedDocumentUrl(urlString: string): { valid: boolean; reason?: string; url?: URL } {
  if (urlString.length > 500) {
    return { valid: false, reason: "Tautan dokumen maksimal 500 karakter" };
  }

  // Wajib tanpa spasi atau karakter kontrol (\x00-\x1F, \x7F)
  if (/[\s\x00-\x1F\x7F]/.test(urlString)) {
    return { valid: false, reason: "Tautan tidak boleh mengandung spasi atau karakter kontrol" };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: "Format tautan dokumen tidak valid" };
  }

  // Wajib protokol https://
  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "Tautan dokumen wajib menggunakan protokol https://" };
  }

  // Tolak URL yang memuat username atau password
  if (parsed.username || parsed.password) {
    return { valid: false, reason: "Tautan tidak boleh memuat kredensial username/password" };
  }

  // Tolak port non-default
  if (parsed.port !== "" && parsed.port !== "443") {
    return { valid: false, reason: "Tautan tidak boleh menggunakan port non-default" };
  }

  const host = parsed.hostname.toLowerCase();

  // Tolak hostname berupa alamat IP (IPv4 atau IPv6)
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const isIpv6 = host.startsWith("[") || host.includes(":");
  if (isIpv4 || isIpv6) {
    return { valid: false, reason: "Hostname tidak boleh berupa alamat IP" };
  }

  // Pencocokan hostname: exact match atau endsWith('.' + domain), BUKAN includes
  if (!isHostnameAllowed(host)) {
    return {
      valid: false,
      reason: `Domain '${host}' tidak diizinkan. Harap lampirkan tautan dari Google Drive/Docs, Notion, GitHub, LinkedIn, Figma, Canva, atau OneDrive.`,
    };
  }

  return { valid: true, url: parsed };
}

// Skema dasar request pendaftaran volunteer
const requestSchema = z.object({
  agendaId: z.string().min(1, "Agenda ID wajib disertakan"),
  turnstileToken: z.string().min(1, "Verifikasi Captcha wajib disertakan"),
  responses: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length <= 50,
    "Jumlah respon melebihi batas yang diizinkan (maksimal 50 field)"
  ),
});

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Maksimal 5 pengiriman pendaftaran per 10 menit per IP)
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkRateLimit(`volunteer_apply_${clientIp}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000, // 10 menit
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        "Terlalu banyak percobaan pendaftaran dari perangkat Anda. Silakan tunggu 10 menit.",
        rateLimitResult
      );
    }

    // 2. Parse & Validasi Dasar Request Body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid (harus JSON)" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const parseResult = requestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Data pendaftaran tidak valid" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const { agendaId, responses, turnstileToken } = parseResult.data;

    // 3. Verifikasi Cloudflare Turnstile Captcha (GAGAL TERTUTUP / FAIL-CLOSED)
    if (!TURNSTILE_SECRET_KEY) {
      console.error("[volunteer/apply] TURNSTILE_SECRET_KEY belum dikonfigurasi di server.");
      return NextResponse.json(
        { error: "Layanan keamanan captcha server sedang tidak tersedia" },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", turnstileToken);

    let outcome: any;
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });
      outcome = await verifyRes.json();
    } catch (fetchErr) {
      console.error("[volunteer/apply] Gagal menghubungi Turnstile siteverify:", fetchErr);
      return NextResponse.json(
        { error: "Gagal memverifikasi captcha. Silakan coba kembali." },
        { status: 502, headers: rateLimitResult.headers }
      );
    }

    if (!outcome?.success) {
      return NextResponse.json(
        { error: "Verifikasi Captcha gagal. Silakan muat ulang halaman dan coba lagi." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // 4. Ambil Definisi Form & Status Agenda dari Database Server
    const supabaseAdmin = getServiceRoleClient();

    const { data: agenda, error: agendaError } = await supabaseAdmin
      .from("agendas")
      .select("id, is_published, deadline, form_schema, type")
      .eq("id", agendaId)
      .maybeSingle();

    if (agendaError || !agenda) {
      return NextResponse.json(
        { error: "Kegiatan / agenda tidak ditemukan" },
        { status: 404, headers: rateLimitResult.headers }
      );
    }

    // Tolak jika belum dipublikasikan
    if (!agenda.is_published) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini tidak dibuka atau belum dipublikasikan" },
        { status: 403, headers: rateLimitResult.headers }
      );
    }

    // Tolak jika formulir pendaftaran tidak didefinisikan / kosong
    const formSchema: Array<{ id: string; type: string; label: string; required: boolean }> =
      Array.isArray(agenda.form_schema) ? agenda.form_schema : [];

    if (formSchema.length === 0) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini tidak dibuka (tidak ada formulir pendaftaran)" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Cek batas waktu deadline pendaftaran
    if (agenda.deadline) {
      const deadlineDate = new Date(agenda.deadline);
      deadlineDate.setHours(23, 59, 59, 999);
      if (new Date() > deadlineDate) {
        return NextResponse.json(
          { error: "Pendaftaran untuk kegiatan ini sudah ditutup" },
          { status: 400, headers: rateLimitResult.headers }
        );
      }
    }

    // 5. Validasi Responses Terhadap Form Schema Server
    const formSchemaMap = new Map<string, { id: string; type: string; label: string; required: boolean }>();
    for (const field of formSchema) {
      formSchemaMap.set(field.id, field);
    }

    // (a) Tolak key yang tidak ada di definisi form
    for (const submittedKey of Object.keys(responses)) {
      if (!formSchemaMap.has(submittedKey)) {
        return NextResponse.json(
          { error: `Field '${submittedKey}' tidak terdaftar dalam formulir pendaftaran kegiatan ini` },
          { status: 400, headers: rateLimitResult.headers }
        );
      }
    }

    // (b) Validasi per field berdasarkan tipe dan kewajiban isian
    let extractedPortofolioUrl: string | null = null;

    for (const field of formSchema) {
      const rawValue = responses[field.id];
      const value = typeof rawValue === "string" ? rawValue.trim() : "";

      // Validasi field wajib
      if (field.required && !value) {
        return NextResponse.json(
          { error: `Kolom '${field.label}' wajib diisi` },
          { status: 400, headers: rateLimitResult.headers }
        );
      }

      // Jika field memiliki nilai, validasi formatnya
      if (value) {
        if (field.type === "file" || field.type === "image") {
          const urlCheck = isAllowedDocumentUrl(value);
          if (!urlCheck.valid) {
            return NextResponse.json(
              { error: `Kolom '${field.label}': ${urlCheck.reason}` },
              { status: 400, headers: rateLimitResult.headers }
            );
          }
          if (!extractedPortofolioUrl) {
            extractedPortofolioUrl = value.slice(0, 500);
          }
        } else {
          // Field teks / textarea / number / tel / email
          if (value.length > 3000) {
            return NextResponse.json(
              { error: `Kolom '${field.label}' melebihi batas maksimal 3000 karakter` },
              { status: 400, headers: rateLimitResult.headers }
            );
          }
          if (field.type === "number" && !/^-?\d+$/.test(value)) {
            return NextResponse.json(
              { error: `Kolom '${field.label}' harus berupa angka yang valid` },
              { status: 400, headers: rateLimitResult.headers }
            );
          }
          if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return NextResponse.json(
              { error: `Kolom '${field.label}' harus berupa alamat email yang valid` },
              { status: 400, headers: rateLimitResult.headers }
            );
          }
        }
      }
    }

    // 6. Simpan Aplikasi Volunteer ke Database via Service Role
    const insertPayload: Record<string, any> = {
      agenda_id: agendaId,
      responses,
    };
    if (extractedPortofolioUrl) {
      insertPayload.portofolio_url = extractedPortofolioUrl;
    }

    const { error: insertError } = await supabaseAdmin
      .from("volunteer_applications")
      .insert([insertPayload]);

    if (insertError) {
      console.error("[volunteer/apply] Database insert error:", insertError.message);
      return NextResponse.json(
        { error: "Gagal menyimpan data pendaftaran. Silakan coba kembali." },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    return NextResponse.json(
      { success: true, message: "Pendaftaran berhasil dikirim" },
      { status: 201, headers: rateLimitResult.headers }
    );
  } catch (err: any) {
    console.error("[volunteer/apply] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
