import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PublicProfileView from "./PublicProfileView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
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

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch profil mahasiswa berdasarkan ID profil
  const { data: mahasiswa } = await supabase
    .from("mahasiswa_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!mahasiswa) {
    notFound();
  }

  // 2. Fetch karya (proyek) yang approved milik mahasiswa ini
  const { data: projects } = await supabase
    .from("karya")
    .select("*")
    .eq("user_id", mahasiswa.user_id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // Format to match ProjectCard props
  const mappedProjects = (projects || []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tech_stack: p.tech_stack || [],
    demo_url: p.live_url,
    github_url: p.github_url,
    cover_image: p.image_url,
    likes_count: p.likes || 0,
    views_count: p.views || 0,
    category: p.category,
    mahasiswa_id: mahasiswa.id,
  }));

  return <PublicProfileView mahasiswa={mahasiswa} projects={mappedProjects} />;
}
