-- ============================================================
-- 1. Tabel log likes (jika belum ada)
-- ============================================================
-- Hapus tabel lama yang salah agar tidak berantakan
DROP TABLE IF EXISTS public.berita_likes_log CASCADE;
DROP TABLE IF EXISTS public.berita_views_log CASCADE;

CREATE TABLE IF NOT EXISTS public.berita_like_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  berita_id   uuid NOT NULL REFERENCES public.berita(id) ON DELETE CASCADE,
  device_id   text,
  user_id     uuid,
  created_at  timestamptz DEFAULT now()
);

-- RLS: anyone can insert/select their own log (by device_id)
ALTER TABLE public.berita_like_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_like_logs"  ON public.berita_like_logs;
DROP POLICY IF EXISTS "allow_public_insert_like_logs" ON public.berita_like_logs;
DROP POLICY IF EXISTS "allow_public_delete_like_logs" ON public.berita_like_logs;

CREATE POLICY "allow_public_read_like_logs"   ON public.berita_like_logs FOR SELECT USING (true);
CREATE POLICY "allow_public_insert_like_logs" ON public.berita_like_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_delete_like_logs" ON public.berita_like_logs FOR DELETE USING (true);

-- ============================================================
-- 2. RLS: Allow public (anon) to UPDATE views & likes on berita
-- ============================================================
DROP POLICY IF EXISTS "allow_public_update_stats" ON public.berita;
CREATE POLICY "allow_public_update_stats"
  ON public.berita
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. Function: check_berita_liked
-- Returns TRUE if device/user has already liked this article
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_berita_liked(
  p_berita_id uuid,
  p_device_id text,
  p_user_id   uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.berita_like_logs
    WHERE berita_id = p_berita_id
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR device_id = p_device_id
      )
  );
END;
$$;

-- ============================================================
-- 4. Function: toggle_berita_like
-- Adds or removes a like, returns new liked state (boolean)
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_berita_like(
  p_berita_id uuid,
  p_device_id text,
  p_user_id   uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  already_liked boolean;
BEGIN
  -- Check if already liked
  already_liked := public.check_berita_liked(p_berita_id, p_device_id, p_user_id);

  IF already_liked THEN
    -- Unlike: remove log & decrement
    DELETE FROM public.berita_like_logs
    WHERE berita_id = p_berita_id
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR device_id = p_device_id
      );
    UPDATE public.berita SET likes = GREATEST(0, likes - 1) WHERE id = p_berita_id;
    RETURN false;
  ELSE
    -- Like: insert log & increment
    INSERT INTO public.berita_like_logs (berita_id, device_id, user_id)
    VALUES (p_berita_id, p_device_id, p_user_id);
    UPDATE public.berita SET likes = likes + 1 WHERE id = p_berita_id;
    RETURN true;
  END IF;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_berita_liked TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_berita_like TO anon, authenticated;
