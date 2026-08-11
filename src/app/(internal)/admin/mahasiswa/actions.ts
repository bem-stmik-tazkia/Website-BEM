"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getMahasiswa() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mahasiswa_profiles")
    .select("*")
    .order("angkatan", { ascending: false })
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching mahasiswa:", error);
    return [];
  }
  return data;
}

export async function getMahasiswaById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mahasiswa_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching mahasiswa by id:", error);
    return null;
  }
  return data;
}

export async function saveMahasiswa(formData: FormData) {
  const supabase = await createClient();
  
  const id = formData.get("id") as string;
  const full_name = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const angkatan = parseInt(formData.get("angkatan") as string, 10);
  const prodi = formData.get("prodi") as string;
  const is_featured = formData.get("is_featured") === "on";

  const payload = {
    full_name,
    email,
    angkatan,
    prodi,
    is_featured,
  };

  if (id) {
    // Update
    const { error } = await supabase
      .from("mahasiswa_profiles")
      .update(payload)
      .eq("id", id);
      
    if (error) {
      console.error("Error updating mahasiswa:", error);
      throw new Error("Gagal mengupdate data mahasiswa");
    }
  } else {
    // Insert
    const { error } = await supabase
      .from("mahasiswa_profiles")
      .insert(payload);
      
    if (error) {
      console.error("Error inserting mahasiswa:", error);
      throw new Error("Gagal menambahkan data mahasiswa");
    }
  }

  revalidatePath("/admin/mahasiswa");
  return { success: true };
}

export async function deleteMahasiswa(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("mahasiswa_profiles")
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error("Error deleting mahasiswa:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/admin/mahasiswa");
  return { success: true };
}
