"use server";

import { requireAdmin, getServiceRoleClient } from "@/lib/auth";
import {
  ModerationArticle,
  ModerationRevision,
} from "@/components/admin/artikel/ArticleModerationModal";

export interface AdminArticlesResponse {
  articles: ModerationArticle[];
  revisions: ModerationRevision[];
  error?: string | null;
}

export async function fetchAdminArticlesData(): Promise<AdminArticlesResponse> {
  try {
    await requireAdmin();
    const serviceClient = getServiceRoleClient();

    // 1. Ambil artikel lengkap beserta author profile
    const { data: artData, error: artError } = await serviceClient
      .from("articles")
      .select(`
        *,
        author:profiles!articles_author_id_fkey(id, full_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false });

    let loadedArticles: ModerationArticle[] = (artData as any) || [];

    if (artError) {
      console.warn("[actions:fetchAdminArticlesData] Join error, falling back to manual join:", artError);
      const { data: rawArticles } = await serviceClient
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rawArticles && rawArticles.length > 0) {
        const authorIds = Array.from(new Set(rawArticles.map((a: any) => a.author_id).filter(Boolean)));
        const { data: profiles } = await serviceClient
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", authorIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        loadedArticles = rawArticles.map((a: any) => ({
          ...a,
          author: profileMap.get(a.author_id) || null,
        }));
      }
    }

    // 2. Ambil revisi pending beserta artikel dan author
    const { data: revData, error: revError } = await serviceClient
      .from("article_revisions")
      .select(`
        *,
        article:articles!article_revisions_article_id_fkey(*),
        author:profiles!article_revisions_author_id_fkey(id, full_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false });

    let loadedRevisions: ModerationRevision[] = (revData as any) || [];

    if (revError) {
      console.warn("[actions:fetchAdminArticlesData] Revisions join error, falling back:", revError);
      const { data: rawRevs } = await serviceClient
        .from("article_revisions")
        .select("*")
        .order("created_at", { ascending: false });

      if (rawRevs && rawRevs.length > 0) {
        const artIds = Array.from(new Set(rawRevs.map((r: any) => r.article_id).filter(Boolean)));
        const authorIds = Array.from(new Set(rawRevs.map((r: any) => r.author_id).filter(Boolean)));

        const [artsRes, profsRes] = await Promise.all([
          serviceClient.from("articles").select("*").in("id", artIds),
          serviceClient.from("profiles").select("id, full_name, email, avatar_url").in("id", authorIds),
        ]);

        const artMap = new Map((artsRes.data || []).map((a: any) => [a.id, a]));
        const profMap = new Map((profsRes.data || []).map((p: any) => [p.id, p]));

        loadedRevisions = rawRevs.map((r: any) => ({
          ...r,
          article: artMap.get(r.article_id) || null,
          author: profMap.get(r.author_id) || null,
        }));
      }
    }

    return {
      articles: loadedArticles,
      revisions: loadedRevisions,
    };
  } catch (err: any) {
    console.error("[actions:fetchAdminArticlesData] Error:", err);
    return {
      articles: [],
      revisions: [],
      error: err.message || "Gagal memuat data artikel admin",
    };
  }
}

export interface AdminPendingArticleNotif {
  id: string;
  type: "artikel";
  title: string;
  author: string;
  created_at: string;
  href: string;
}

export async function fetchPendingArticlesForBell(): Promise<AdminPendingArticleNotif[]> {
  try {
    await requireAdmin();
    const serviceClient = getServiceRoleClient();
    const { data: articles, error } = await serviceClient
      .from("articles")
      .select(`
        id,
        title,
        created_at,
        author:profiles!articles_author_id_fkey(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("[actions:fetchPendingArticlesForBell] Error fetching:", error.message);
      return [];
    }

    return (articles || []).map((a: any) => ({
      id: a.id,
      type: "artikel" as const,
      title: a.title,
      author: a.author?.full_name || "Mahasiswa",
      created_at: a.created_at,
      href: "/admin/artikel",
    }));
  } catch (err) {
    console.warn("[actions:fetchPendingArticlesForBell] Error:", err);
    return [];
  }
}

