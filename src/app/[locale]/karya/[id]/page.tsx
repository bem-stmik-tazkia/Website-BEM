import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: project } = await supabase
    .from('karya')
    .select('title, description, image_url')
    .eq('id', id)
    .single();

  if (!project) {
    return {
      title: "Karya Tidak Ditemukan",
    };
  }

  const title = `${project.title} | BEM STMIK Tazkia`;
  const description = project.description?.substring(0, 160) || "Lihat karya inovatif ini di Portal Inovasi Mahasiswa.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: project.image_url ? [project.image_url] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: project.image_url ? [project.image_url] : [],
    },
  };
}

export default async function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
