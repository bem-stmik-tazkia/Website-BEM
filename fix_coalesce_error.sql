-- ============================================================================
-- SOLUSI: Hapus wrapper fungsi coalesce kustom yang menimpa keyword native Postgres
-- Jalankan 4 baris SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================================

DROP FUNCTION IF EXISTS pg_catalog.coalesce(uuid, uuid);
DROP FUNCTION IF EXISTS pg_catalog.coalesce(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.coalesce(uuid, uuid);
DROP FUNCTION IF EXISTS public.coalesce(uuid, uuid, uuid);
