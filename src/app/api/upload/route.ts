import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";

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

    // 2. Validasi tipe file (hanya gambar)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file gambar." },
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

    // 4. Validasi folder: mahasiswa non-admin dibatasi ke folder 'artikel'
    const { data: isRpcAdmin } = await supabase.rpc("is_admin");
    const isAdmin = Boolean(isRpcAdmin);
    const targetFolder = isAdmin ? folder : "artikel";

    // 5. Generate nama file unik
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt)
      ? fileExt
      : "jpg";
    const randomHash = Math.random().toString(36).substring(2, 12);
    const fileName = `${Date.now()}_${randomHash}.${safeExt}`;
    const filePath = `${targetFolder}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload menggunakan Service Role Client agar aman & tidak terhalang RLS storage
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

    // 7. Ambil URL publik gambar
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
