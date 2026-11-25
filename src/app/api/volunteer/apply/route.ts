import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/auth";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { sendVolunteerAppliedNotification } from "@/lib/telegram";
import {
  hasAnyFormQuestions,
  isDeadlinePassedJakarta,
  isHostnameAllowed,
  validateItemSelection,
  validateMultiItemRegistrationResponses,
  validateRegistrationResponses,
} from "@/lib/registration-validation";
import type { DynamicFormField } from "@/types/agenda";

export { isHostnameAllowed };

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Skema dasar request pendaftaran
const requestSchema = z.object({
  agendaId: z.string().uuid("Agenda ID tidak valid"),
  itemId: z.string().uuid().optional(),
  itemIds: z.array(z.string().uuid("Pilihan posisi/lomba tidak valid")).max(20).optional(),
  turnstileToken: z.string().min(1, "Verifikasi Captcha wajib disertakan"),
  responses: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length <= 80,
    "Jumlah respon melebihi batas yang diizinkan (maksimal 80 field)"
  ),
});

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Maksimal 5 pengiriman pendaftaran per 10 menit per IP)
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkRateLimit(`volunteer_apply_${clientIp}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
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

    const { agendaId, itemId, itemIds, responses, turnstileToken } = parseResult.data;
    const requestedItemIds = Array.from(
      new Set([...(itemIds || []), ...(itemId ? [itemId] : [])].filter(Boolean))
    );

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

    // 4. Ambil Definisi Form, Sub-Item, & Status Agenda dari Database Server
    const supabaseAdmin = getServiceRoleClient();

    const { data: agenda, error: agendaError } = await supabaseAdmin
      .from("agendas")
      .select("id, title, slug, is_published, deadline, form_schema, type, max_participants, allow_multiple_items")
      .eq("id", agendaId)
      .maybeSingle();

    if (agendaError || !agenda) {
      return NextResponse.json(
        { error: "Kegiatan / agenda tidak ditemukan" },
        { status: 404, headers: rateLimitResult.headers }
      );
    }

    if (!agenda.is_published) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini tidak dibuka atau belum dipublikasikan" },
        { status: 403, headers: rateLimitResult.headers }
      );
    }

    const formSchema: DynamicFormField[] = Array.isArray(agenda.form_schema)
      ? agenda.form_schema
      : [];

    // Ambil sub-items (posisi / cabang lomba) beserta extra_fields jika tersedia
    const { data: agendaItems, error: itemsError } = await supabaseAdmin
      .from("agenda_items")
      .select("id, name, quota, extra_fields")
      .eq("agenda_id", agendaId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("[volunteer/apply] Error reading agenda_items:", itemsError.message);
      return NextResponse.json(
        { error: "Gagal memeriksa posisi/cabang pendaftaran" },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    const items = (agendaItems || []) as Array<{
      id: string;
      name: string;
      quota: number | null;
      extra_fields?: DynamicFormField[] | null;
    }>;

    if (!hasAnyFormQuestions(formSchema, items)) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini tidak dibuka (tidak ada formulir pendaftaran)" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (isDeadlinePassedJakarta(agenda.deadline)) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini sudah ditutup" },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const selectionValidation = validateItemSelection({
      agendaType: agenda.type,
      allowMultipleItems: agenda.allow_multiple_items,
      availableItems: items,
      requestedItemIds,
    });
    if (!selectionValidation.valid) {
      return NextResponse.json(
        { error: selectionValidation.error },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const selectedItems = items.filter((it) =>
      selectionValidation.selectedItemIds.includes(it.id)
    );

    // 5. Validasi Responses Terhadap Form Utama + Pertanyaan Khusus Item Terpilih
    let extractedPortofolioUrl: string | null = null;
    let responsesByItem: Record<string, Record<string, string>> | null = null;
    let formattedFieldsForTelegram: Array<{ label: string; value: string }> = [];

    if (selectedItems.length > 0) {
      const multiCheck = validateMultiItemRegistrationResponses({
        commonSchema: formSchema,
        selectedItems,
        responses,
      });
      if (!multiCheck.valid) {
        return NextResponse.json(
          { error: multiCheck.error },
          { status: 400, headers: rateLimitResult.headers }
        );
      }
      responsesByItem = multiCheck.responsesByItem;
      extractedPortofolioUrl = multiCheck.extractedPortofolioUrl;
      formattedFieldsForTelegram = multiCheck.mergedFieldsForSummary;
    } else {
      const singleCheck = validateRegistrationResponses(formSchema, responses);
      if (!singleCheck.valid) {
        return NextResponse.json(
          { error: singleCheck.error },
          { status: 400, headers: rateLimitResult.headers }
        );
      }
      extractedPortofolioUrl = singleCheck.extractedPortofolioUrl;
      formattedFieldsForTelegram = formSchema.map((field) => ({
        label: field.label,
        value: typeof responses[field.id] === "string" ? responses[field.id].trim() : "",
      }));
    }

    // 6. Simpan Pendaftaran Secara Atomik (Lock Kuota via RPC)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "submit_agenda_registration",
      {
        p_agenda_id: agendaId,
        p_item_ids:
          selectionValidation.selectedItemIds.length > 0
            ? selectionValidation.selectedItemIds
            : null,
        p_responses: responses,
        p_portofolio_url: extractedPortofolioUrl,
        p_batch_id: null,
        p_responses_by_item: responsesByItem,
      }
    );

    if (rpcError) {
      const msg = rpcError.message || "";
      if (msg.includes("QUOTA_FULL:")) {
        const fullTarget = msg.split("QUOTA_FULL:")[1]?.trim() || agenda.title;
        return NextResponse.json(
          { error: `Maaf, kuota untuk "${fullTarget}" sudah terisi penuh.` },
          { status: 409, headers: rateLimitResult.headers }
        );
      }
      if (msg.includes("DEADLINE_PASSED")) {
        return NextResponse.json(
          { error: "Pendaftaran untuk kegiatan ini sudah ditutup." },
          { status: 400, headers: rateLimitResult.headers }
        );
      }
      if (
        msg.includes("ITEM_REQUIRED") ||
        msg.includes("INVALID_ITEM") ||
        msg.includes("MULTIPLE_ITEMS_NOT_ALLOWED")
      ) {
        return NextResponse.json(
          { error: "Pilihan posisi / cabang lomba tidak valid." },
          { status: 400, headers: rateLimitResult.headers }
        );
      }

      console.error("[volunteer/apply] RPC submit_agenda_registration error:", msg);
      return NextResponse.json(
        { error: "Gagal menyimpan data pendaftaran. Silakan coba kembali." },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    const itemNames: string[] = Array.isArray(rpcResult?.item_names)
      ? rpcResult.item_names
      : [];
    const totalAccepted: number | undefined =
      typeof rpcResult?.total_accepted === "number" ? rpcResult.total_accepted : undefined;

    // Segarkan cache halaman publik & kuota
    revalidateTag("agenda", "max");
    revalidatePath("/agenda");
    revalidatePath("/[locale]/agenda", "page");
    revalidatePath(`/[locale]/agenda/${agendaId}`, "page");
    if (agenda.slug) {
      revalidatePath(`/[locale]/agenda/${agenda.slug}`, "page");
    }
    revalidatePath("/admin/kegiatan");
    revalidatePath(`/admin/kegiatan/${agendaId}/pendaftar`);

    // 7. Kirim notifikasi teknis ke Telegram internal pengurus (non-blocking)
    try {
      await sendVolunteerAppliedNotification({
        agendaId: agenda.id,
        agendaTitle: agenda.title || "Kegiatan BEM",
        agendaType: agenda.type,
        selectedItems: itemNames,
        fields: formattedFieldsForTelegram,
        totalParticipants: totalAccepted,
      });
    } catch (teleErr) {
      console.warn("[volunteer/apply] Gagal mengirim notif Telegram:", teleErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pendaftaran berhasil dikirim",
        selectedItems: itemNames,
      },
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
