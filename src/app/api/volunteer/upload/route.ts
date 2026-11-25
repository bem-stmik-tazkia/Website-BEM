import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/auth";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { isValidImageSignature } from "@/lib/imageValidation";
import { hasAnyImageField, isDeadlinePassedJakarta } from "@/lib/registration-validation";
import type { DynamicFormField } from "@/types/agenda";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Endpoint upload foto khusus peserta form pendaftaran publik (Event / Oprec).
 * Tidak mensyaratkan login mahasiswa, tetapi divalidasi ketat:
 * - Rate limit per IP
 * - Agenda harus valid, published, belum lewat deadline, dan memiliki field bertipe 'image'
 * - Ukuran <= 2MB, MIME raster gambar murni, dan validasi Magic Bytes biner
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(`volunteer_upload_${clientIp}`, {
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        "Terlalu banyak unggahan foto dari perangkat Anda. Silakan tunggu sebentar.",
        rateLimitResult
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const agendaId = (formData.get("agendaId") as string | null)?.trim() || "";

    if (!agendaId || !UUID_REGEX.test(agendaId)) {
      return NextResponse.json(
        { error: "ID kegiatan tidak valid." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "File foto tidak ditemukan." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Ukuran foto terlalu besar. Maksimal 2MB." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const serviceClient = getServiceRoleClient();
    const { data: agenda, error: agendaErr } = await serviceClient
      .from("agendas")
      .select("id, type, is_published, deadline, form_schema")
      .eq("id", agendaId)
      .maybeSingle();

    if (agendaErr || !agenda || !agenda.is_published) {
      return NextResponse.json(
        { error: "Kegiatan tidak ditemukan atau pendaftaran belum dibuka." },
        { status: 403, headers: rateLimitResult.headers }
      );
    }

    if (isDeadlinePassedJakarta(agenda.deadline)) {
      return NextResponse.json(
        { error: "Pendaftaran untuk kegiatan ini sudah ditutup." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const formSchema: DynamicFormField[] = Array.isArray(agenda.form_schema)
      ? agenda.form_schema
      : [];
    const { data: agendaItems } = await serviceClient
      .from("agenda_items")
      .select("extra_fields")
      .eq("agenda_id", agendaId);

    const hasImageField = hasAnyImageField(
      formSchema,
      (agendaItems as Array<{ extra_fields?: DynamicFormField[] | null }>) || []
    );
    if (!hasImageField) {
      return NextResponse.json(
        { error: "Formulir kegiatan ini tidak memiliki kolom upload gambar." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { error: "Pemeriksaan keamanan gagal: berkas bukan gambar asli yang valid." },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
    const randomHash = Math.random().toString(36).substring(2, 12);
    const filePath = `pendaftaran/${agendaId}/${Date.now()}_${randomHash}.${safeExt}`;

    const { error: uploadError } = await serviceClient.storage
      .from("public_images")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[volunteer/upload] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Gagal menyimpan foto ke server. Silakan coba lagi." },
        { status: 500, headers: rateLimitResult.headers }
      );
    }

    const {
      data: { publicUrl },
    } = serviceClient.storage.from("public_images").getPublicUrl(filePath);

    return NextResponse.json(
      { ok: true, publicUrl },
      { status: 201, headers: rateLimitResult.headers }
    );
  } catch (err: unknown) {
    console.error("[volunteer/upload] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengunggah foto." },
      { status: 500 }
    );
  }
}
