import React from "react";
import BeritaForm from "../BeritaForm";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditBeritaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: berita } = await supabase.from('berita').select('*').eq('id', id).single();

  if (!berita) {
    notFound();
  }

  return (
    <div>
      <BeritaForm initialData={berita} />
    </div>
  );
}
