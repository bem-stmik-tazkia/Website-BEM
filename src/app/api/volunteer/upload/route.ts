import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { isValidImageSignature } from "@/lib/imageValidation";
import { hasAnyImageField, isDeadlinePassedJakarta } from "@/lib/registration-validation";
import type { DynamicFormField } from "@/types/agenda";
import { getLocaleFromRequest, getPublicApiMessage } from "@/lib/public-api-i18n";

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
  const headerLocale = getLocaleFromRequest(request);
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(`volunteer_upload_${clientIp}`, {
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        getPublicApiMessage(headerLocale, "uploadRateLimit"),
        rateLimitResult
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const agendaId = (formData.get("agendaId") as string | null)?.trim() || "";
    const locale = getLocaleFromRequest(request, formData.get("locale") as string | null);

    if (!agendaId || !UUID_REGEX.test(agendaId)) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "invalidAgendaId") },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "photoFileMissing") },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "photoFormatUnsupported") },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "photoTooLarge") },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const serviceClient = getServiceRoleClient();
    let { data: agenda, error: agendaErr } = await serviceClient
      .from("agendas")
      .select("id, type, is_published, deadline, form_schema, require_login")
      .eq("id", agendaId)
      .maybeSingle();

    if (agendaErr && (agendaErr.message || "").toLowerCase().includes("require_login")) {
      const retryAgenda = await serviceClient
        .from("agendas")
        .select("id, type, is_published, deadline, form_schema")
        .eq("id", agendaId)
        .maybeSingle();
      agenda = retryAgenda.data ? { ...retryAgenda.data, require_login: retryAgenda.data.type === "volunteer" } : null;
      agendaErr = retryAgenda.error;
    }

    if (agendaErr || !agenda || !agenda.is_published) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "photoAgendaUnavailable") },
        { status: 403, headers: rateLimitResult.headers }
      );
    }

    const requiresLogin = Boolean(
      typeof (agenda as any).require_login === "boolean"
        ? (agenda as any).require_login
        : agenda.type === "volunteer"
    );
    if (requiresLogin) {
      const supabaseAuth = await createClient();
      const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
      if (!authUser) {
        return NextResponse.json(
          { error: getPublicApiMessage(locale, "loginRequired") },
          { status: 401, headers: rateLimitResult.headers }
        );
      }
    }

    if (isDeadlinePassedJakarta(agenda.deadline)) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "registrationClosed") },
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
        { error: getPublicApiMessage(locale, "noImageField") },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { error: getPublicApiMessage(locale, "invalidImageSignature") },
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
        { error: getPublicApiMessage(locale, "savePhotoFailed") },
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
      { error: getPublicApiMessage(headerLocale, "uploadServerError") },
      { status: 500 }
    );
  }
}
