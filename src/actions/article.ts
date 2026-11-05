"use server";

import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";

/**
 * Menarik pengajuan artikel yang sedang berstatus 'pending' kembali ke 'draft'.
 * Ini memungkinkan mahasiswa mengedit atau menghapus artikel sebelum diperiksa admin.
 */
export async function withdrawArticleSubmission(articleId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };
    }

    // 1. Coba eksekusi melalui RPC Postgres terlebih dahulu
    const { error: rpcError } = await supabase.rpc("withdraw_article_submission", {
      p_article_id: articleId,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Jika RPC belum terpasang atau fallback, verifikasi kepemilikan
    const service = getServiceRoleClient();
    const { data: article, error: fetchErr } = await service
      .from("articles")
      .select("id, author_id, status")
      .eq("id", articleId)
      .single();

    if (fetchErr || !article) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    if (article.author_id !== user.id) {
      return { success: false, error: "Anda tidak memiliki izin untuk artikel ini." };
    }

    if (article.status !== "pending") {
      return {
        success: false,
        error: "Hanya artikel berstatus antrean (pending) yang dapat ditarik kembali ke draf.",
      };
    }

    // Eksekusi update status ke draft
    const { error: updateErr } = await service
      .from("articles")
      .update({
        status: "draft",
        submitted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    if (updateErr) {
      return {
        success: false,
        error: updateErr.message || "Gagal mengubah status artikel ke draf.",
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat memproses penarikan artikel.",
    };
  }
}

