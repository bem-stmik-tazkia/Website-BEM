-- ============================================================
-- ANTI-SPAM: View & Like Protection
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: berita_view_logs — 24-hour cooldown per device
-- ============================================================
CREATE TABLE IF NOT EXISTS public.berita_view_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  berita_id   uuid NOT NULL REFERENCES public.berita(id) ON DELETE CASCADE,
  device_id   text NOT NULL,
  viewed_at   timestamptz DEFAULT now()
);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS berita_view_logs_device_berita_idx
  ON public.berita_view_logs (device_id, berita_id, viewed_at DESC);

-- RLS
ALTER TABLE public.berita_view_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_insert_view_logs" ON public.berita_view_logs;
DROP POLICY IF EXISTS "allow_public_read_view_logs"   ON public.berita_view_logs;

CREATE POLICY "allow_public_insert_view_logs" ON public.berita_view_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_read_view_logs"   ON public.berita_view_logs FOR SELECT USING (true);

-- ============================================================
-- PART 2: UNIQUE constraint on berita_like_logs
-- Prevent duplicate likes at DB level (race condition safe)
-- ============================================================
-- Drop if exists first to avoid conflict
ALTER TABLE public.berita_like_logs
  DROP CONSTRAINT IF EXISTS berita_like_logs_unique_device;

ALTER TABLE public.berita_like_logs
  ADD CONSTRAINT berita_like_logs_unique_device
  UNIQUE (berita_id, device_id);

-- ============================================================
-- PART 3: Function record_berita_view
-- Returns TRUE if view was counted, FALSE if still in cooldown
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_berita_view(
  p_berita_id uuid,
  p_device_id text,
  p_cooldown_hours int DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  last_viewed timestamptz;
  cooldown_until timestamptz;
BEGIN
  -- Cari waktu view terakhir device ini untuk artikel ini
  SELECT viewed_at INTO last_viewed
    FROM public.berita_view_logs
   WHERE berita_id = p_berita_id
     AND device_id = p_device_id
   ORDER BY viewed_at DESC
   LIMIT 1;

  -- Hitung batas cooldown
  cooldown_until := last_viewed + (p_cooldown_hours || ' hours')::interval;

  -- Kalau belum pernah view atau sudah lewat 24 jam → catat & increment
  IF last_viewed IS NULL OR now() > cooldown_until THEN
    INSERT INTO public.berita_view_logs (berita_id, device_id)
      VALUES (p_berita_id, p_device_id);

    UPDATE public.berita
       SET views = COALESCE(views, 0) + 1
     WHERE id = p_berita_id;

    RETURN true; -- view dihitung
  ELSE
    RETURN false; -- masih cooldown, view tidak dihitung
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_berita_view TO anon, authenticated;

-- ============================================================
-- PART 4: Update toggle_berita_like — gunakan ON CONFLICT
-- untuk race condition safety (memanfaatkan unique constraint)
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
  already_liked := public.check_berita_liked(p_berita_id, p_device_id, p_user_id);

  IF already_liked THEN
    -- Unlike
    DELETE FROM public.berita_like_logs
     WHERE berita_id = p_berita_id
       AND (
         (p_user_id IS NOT NULL AND user_id = p_user_id)
         OR device_id = p_device_id
       );
    UPDATE public.berita
       SET likes = GREATEST(0, likes - 1)
     WHERE id = p_berita_id;
    RETURN false;
  ELSE
    -- Like — ON CONFLICT DO NOTHING sebagai pengaman double-insert
    INSERT INTO public.berita_like_logs (berita_id, device_id, user_id)
      VALUES (p_berita_id, p_device_id, p_user_id)
      ON CONFLICT (berita_id, device_id) DO NOTHING;

    -- Hanya increment jika INSERT berhasil (bukan conflict)
    IF FOUND THEN
      UPDATE public.berita
         SET likes = likes + 1
       WHERE id = p_berita_id;
    END IF;

    RETURN true;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_berita_like TO anon, authenticated;
