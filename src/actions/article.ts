"use server";

import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/auth";
import { notifyArticleWithdrawn } from "@/actions/telegram-notifications";
import { revalidatePath } from "next/cache";

/**
 * Menarik artikel (baik berstatus 'pending' antrean moderasi maupun 'published' yang sedang tayang)
 * kembali ke 'draft'.
 * Ini memastikan alur terstruktur: artikel harus ditarik/diturunkan terlebih dahulu ke draf
 * sebelum mahasiswa dapat mengedit isinya kembali atau menghapusnya.
 * Tindakan ini sekaligus mengirimkan notifikasi audit ke Telegram pengurus BEM dan
 * membersihkan cache halaman publik.
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
      .select("id, author_id, status, title, category, slug")
      .eq("id", articleId)
      .single();

    if (fetchErr || !article) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    if (article.author_id !== user.id) {
      return { success: false, error: "Anda tidak memiliki izin untuk artikel ini." };
    }

    if (article.status !== "pending" && article.status !== "published") {
      return {
        success: false,
        error: "Hanya artikel berstatus antrean (pending) atau tayang (published) yang dapat ditarik kembali ke draf.",
      };
    }

    const wasPublished = article.status === "published";

    // 1. Coba eksekusi melalui RPC Postgres terlebih dahulu
    let updateSuccess = false;
    const { error: rpcError } = await supabase.rpc("withdraw_article_submission", {
      p_article_id: articleId,
    });

    if (!rpcError) {
      updateSuccess = true;
    } else {
      // 2. Fallback update via service role client
      const updatePayload: Record<string, any> = {
        status: "draft",
        updated_at: new Date().toISOString(),
      };
      if (article.status === "pending") {
        updatePayload.submitted_at = null;
      }

      const { error: updateErr } = await service
        .from("articles")
        .update(updatePayload)
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
      // Revalidasi cache halaman artikel publik & detail jika sebelumnya berstatus tayang
      try {
        revalidatePath("/artikel");
        revalidatePath("/dashboard/artikel");
        if (article.slug) {
          revalidatePath(`/artikel/${article.slug}`);
        }
      } catch (revErr) {
        console.warn("[withdrawArticleSubmission] Revalidation warning:", revErr);
      }

      // Jika sebelumnya berstatus tayang, tutup revisi pending di tabel article_revisions agar tidak menggantung di antrean admin
      if (wasPublished) {
        try {
          await service
            .from("article_revisions")
            .update({
              status: "rejected",
              review_note: "Revisi ditutup otomatis karena artikel induk ditarik kembali ke draf oleh penulis.",
            })
            .eq("article_id", articleId)
            .in("status", ["draft", "pending"]);
        } catch (revErr) {
          console.warn("[withdrawArticleSubmission] Warning updating revisions:", revErr);
        }
      }

      // Kirim notifikasi Telegram ke bot admin BEM di latar belakang (non-blocking)
      notifyArticleWithdrawn({
        title: article.title,
        category: article.category || "Artikel Mahasiswa",
        authorName: user.user_metadata?.full_name,
        authorEmail: user.email,
      }).catch((err) => {
        console.error("[withdrawArticleSubmission] Telegram notify error:", err);
      });

      return { success: true, wasPublished };
    }

    return { success: false, error: "Gagal memproses penarikan artikel." };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat memproses penarikan artikel.",
    };
  }
}

/** Alias untuk keterbacaan kode arsitektur */
export const retractArticleToDraft = withdrawArticleSubmission;
