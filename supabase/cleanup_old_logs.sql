-- Script untuk membuang tabel log lama yang tidak terpakai
-- karena sudah diganti dengan sistem anti-spam yang baru (berita_view_logs & berita_like_logs)

DROP TABLE IF EXISTS public.berita_likes_log CASCADE;
DROP TABLE IF EXISTS public.berita_views_log CASCADE;
