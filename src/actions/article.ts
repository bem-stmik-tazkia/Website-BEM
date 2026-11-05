"use server";

import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";
import { notifyArticleWithdrawn } from "@/actions/telegram-notifications";

/**
 * Menarik pengajuan artikel yang sedang berstatus 'pending' kembali ke 'draft'.
 * Ini memungkinkan mahasiswa mengedit atau menghapus artikel sebelum diperiksa admin,
 * sekaligus mengirimkan notifikasi audit ke Telegram pengurus BEM.
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

    // Ambil data artikel untuk verifikasi dan notifikasi Telegram
    const service = getServiceRoleClient();
    const { data: article, error: fetchErr } = await service
      .from("articles")
      .select("id, author_id, status, title, category")
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

    // 1. Coba eksekusi melalui RPC Postgres terlebih dahulu
    let updateSuccess = false;
    const { error: rpcError } = await supabase.rpc("withdraw_article_submission", {
      p_article_id: articleId,
    });

    if (!rpcError) {
      updateSuccess = true;
    } else {
      // 2. Fallback update via service role client
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
      updateSuccess = true;
    }

    if (updateSuccess) {
      // Kirim notifikasi Telegram ke bot admin BEM di latar belakang (non-blocking)
      notifyArticleWithdrawn({
        title: article.title,
        category: article.category || "Artikel Mahasiswa",
        authorName: user.user_metadata?.full_name,
        authorEmail: user.email,
      }).catch((err) => {
        console.error("[withdrawArticleSubmission] Telegram notify error:", err);
      });

      return { success: true };
    }

    return { success: false, error: "Gagal memproses penarikan artikel." };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat memproses penarikan artikel.",
    };
  }
}
