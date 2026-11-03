import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";

/**
 * Validasi Magic Bytes biner gambar.
 * Memastikan file yang diunggah benar-benar file raster gambar murni (JPEG/PNG/WebP/GIF)
 * dan menolak executable, script berbahaya, SVG XSS, atau berkas polyglot.
 */
function isValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: RIFF .... WEBP
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (isWebp) return true;

  // GIF: GIF87a or GIF89a
  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;
  if (isGif) return true;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi pengguna terautentikasi
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda harus login untuk mengunggah gambar." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "artikel";

    if (!file) {
      return NextResponse.json(
        { error: "File gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    // 2. Validasi tipe file MIME (hanya gambar, tolak SVG untuk mencegah serangan SVG-XSS)
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file gambar raster (JPG, PNG, atau WebP)." },
        { status: 400 }
      );
    }

    // 3. Validasi ukuran (maks 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 2MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Validasi Magic Bytes Biner (Mencegah Webshell, Polyglot, dan Skrip Berbahaya Tersembunyi)
    if (!isValidImageSignature(buffer)) {
      return NextResponse.json(
        { error: "Pemeriksaan keamanan gagal: Berkas bukan gambar asli atau mengandung format yang tidak diizinkan." },
        { status: 400 }
      );
    }

    // 5. Validasi folder: mahasiswa non-admin dibatasi ke folder 'artikel'
    const { data: isRpcAdmin } = await supabase.rpc("is_admin");
    const isAdmin = Boolean(isRpcAdmin);
    const targetFolder = isAdmin ? folder : "artikel";

    // 6. Generate nama file unik dengan ekstensi aman
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt)
      ? fileExt
      : "jpg";
    const randomHash = Math.random().toString(36).substring(2, 12);
    const fileName = `${Date.now()}_${randomHash}.${safeExt}`;
    const filePath = `${targetFolder}/${fileName}`;

    // 7. Upload menggunakan Service Role Client agar aman & tidak terhalang RLS storage
    const serviceClient = getServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("public_images")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[api/upload] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Gagal menyimpan gambar: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. Ambil URL publik gambar
    const {
      data: { publicUrl },
    } = serviceClient.storage.from("public_images").getPublicUrl(filePath);

    return NextResponse.json({ ok: true, publicUrl });
  } catch (err: any) {
    console.error("[api/upload] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan server saat mengunggah gambar." },
      { status: 500 }
    );
  }
}
