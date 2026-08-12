import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: mahasiswa } = await supabase
    .from("mahasiswa_profiles")
    .select("full_name, bio")
    .eq("id", id)
    .single();

  if (!mahasiswa) return { title: "Profil Tidak Ditemukan - BEM STMIK Tazkia" };

  return {
    title: `Profil ${mahasiswa.full_name} - BEM STMIK Tazkia`,
    description: mahasiswa.bio || `Portofolio dan profil lengkap mahasiswa BEM STMIK Tazkia.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  // Redirect ke halaman mahasiswa dengan overlay — konsisten dengan design Foto 2
  // Tombol X pada overlay akan kembali ke /mahasiswa secara otomatis
  redirect(`/${locale}/mahasiswa?id=${id}`);
}
