-- ============================================================================
-- Migrasi: Izinkan Mahasiswa Menarik Pengajuan Artikel (pending -> draft)
-- File: supabase/migrations/20261105190000_allow_withdraw_article_submission.sql
-- ============================================================================

-- 1. Perbarui Trigger enforce_article_update_rules
CREATE OR REPLACE FUNCTION public.enforce_article_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.author_id <> OLD.author_id THEN
    RAISE EXCEPTION 'Pelanggaran keamanan: author_id tidak boleh diubah.';
  END IF;

  -- Izinkan penarikan pengajuan kembali ke draf (pending -> draft) oleh penulis aslinya
  IF OLD.status = 'pending' AND NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  IF OLD.status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'Artikel berstatus % terkunci dan tidak dapat diedit langsung.', OLD.status;
  END IF;

  IF NEW.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Pelanggaran keamanan: Mahasiswa tidak diizinkan mengubah status ke %.', NEW.status;
  END IF;

  IF NEW.published_at IS NOT NULL AND OLD.published_at IS NULL THEN
    RAISE EXCEPTION 'Pelanggaran keamanan: Hanya admin yang dapat mempublikasikan artikel.';
  END IF;

  IF NEW.reviewed_by IS NOT NULL AND NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Pelanggaran keamanan: reviewed_by hanya dapat diisi oleh admin.';
  END IF;

  IF NEW.review_note IS NOT NULL AND NEW.review_note IS DISTINCT FROM OLD.review_note THEN
    RAISE EXCEPTION 'Pelanggaran keamanan: review_note tidak boleh diubah oleh mahasiswa.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Perbarui Policy RLS UPDATE pada public.articles
DROP POLICY IF EXISTS "Authors can update own draft or rejected articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can update own draft, pending, or rejected articles" ON public.articles;

CREATE POLICY "Authors can update own draft, pending, or rejected articles"
  ON public.articles FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND status IN ('draft', 'pending', 'rejected'))
  WITH CHECK (
    author_id = (SELECT auth.uid()) 
    AND status IN ('draft', 'pending')
    AND review_note IS NULL
    AND reviewed_by IS NULL
    AND published_at IS NULL
  );

-- 3. Fungsi RPC withdraw_article_submission untuk kemudahan pemanggilan aman
CREATE OR REPLACE FUNCTION public.withdraw_article_submission(p_article_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Anda belum terautentikasi.';
  END IF;

  UPDATE public.articles
  SET 
    status = 'draft',
    submitted_at = NULL,
    updated_at = NOW()
  WHERE id = p_article_id 
    AND author_id = v_user_id 
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artikel tidak ditemukan atau bukan berstatus pending milik Anda.';
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_article_submission(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_article_submission(UUID) TO authenticated;

