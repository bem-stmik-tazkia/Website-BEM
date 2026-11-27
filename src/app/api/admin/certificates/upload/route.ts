import { NextRequest, NextResponse } from "next/server";
import { verifyAdminApi, getServiceRoleClient } from "@/lib/auth";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { isSafePdfBuffer, isValidImageSignature } from "@/lib/imageValidation";

const MAX_CERT_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB (selaras limit bucket public_images)
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminApi();
    if (!auth.authorized) {
      return auth.response;
    }

    const rateLimit = await checkRateLimit(`admin_cert_upload_${auth.user.id}`, {
      limit: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return createRateLimitResponse(
        "Terlalu banyak permintaan unggah berkas sertifikat. Silakan tunggu sebentar.",
        rateLimit
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kind = ((formData.get("kind") as string | null) || "asset").trim();

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Berkas tidak ditemukan atau kosong." },
        { status: 400, headers: rateLimit.headers }
      );
    }

    if (file.size > MAX_CERT_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Ukuran berkas terlalu besar. Maksimal 5MB." },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const isPdf = file.type === "application/pdf";
    const isImage = ALLOWED_IMAGE_MIME.has(file.type);

    // Background template & tanda tangan harus gambar raster; sertifikat custom penerima boleh PDF/gambar
    if (kind === "background" || kind === "signature") {
      if (!isImage) {
        return NextResponse.json(
          { error: "Template/tanda tangan harus berformat JPG, PNG, atau WebP." },
          { status: 400, headers: rateLimit.headers }
        );
      }
    } else if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Format berkas harus PDF, JPG, PNG, atau WebP." },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (isPdf) {
      if (!isSafePdfBuffer(buffer)) {
        return NextResponse.json(
          {
            error:
              "Pemeriksaan keamanan gagal: Berkas PDF tidak valid atau mengandung skrip/aksi aktif yang dilarang.",
          },
          { status: 400, headers: rateLimit.headers }
        );
      }
    } else if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { error: "Pemeriksaan keamanan gagal: Berkas gambar tidak valid." },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/webp": "webp",
      "image/jpeg": "jpg",
    };
    const safeExt = extMap[file.type] || "png";
    const safeKind = ["background", "signature", "custom"].includes(kind) ? kind : "asset";
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const storagePath = `certificates/${safeKind}/${Date.now()}_${randomSuffix}.${safeExt}`;

    const serviceClient = getServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("public_images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Gagal mengunggah berkas sertifikat: ${uploadError.message}` },
        { status: 500, headers: rateLimit.headers }
      );
    }

    const {
      data: { publicUrl },
    } = serviceClient.storage.from("public_images").getPublicUrl(storagePath);

    return NextResponse.json(
      {
        ok: true,
        publicUrl,
        storagePath,
        mimeType: file.type,
      },
      { headers: rateLimit.headers }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Gagal mengunggah berkas sertifikat." },
      { status: 500 }
    );
  }
}
