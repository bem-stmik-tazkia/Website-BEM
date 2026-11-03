-- ============================================================================
-- FIX: function pg_catalog.coalesce(uuid, uuid) does not exist
-- Jalankan seluruh script ini di Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Definisikan wrapper fungsi pg_catalog / public coalesce (opsional & aman)
DO $$
BEGIN
  BEGIN
    CREATE OR REPLACE FUNCTION pg_catalog.coalesce(uuid, uuid) 
    RETURNS uuid AS $func$
      SELECT CASE WHEN $1 IS NOT NULL THEN $1 ELSE $2 END;
    $func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    CREATE OR REPLACE FUNCTION pg_catalog.coalesce(uuid, uuid, uuid) 
    RETURNS uuid AS $func$
      SELECT CASE WHEN $1 IS NOT NULL THEN $1 WHEN $2 IS NOT NULL THEN $2 ELSE $3 END;
    $func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    CREATE OR REPLACE FUNCTION public.coalesce(uuid, uuid) 
    RETURNS uuid AS $func$
      SELECT CASE WHEN $1 IS NOT NULL THEN $1 ELSE $2 END;
    $func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;


-- 2. Perbaiki Trigger Audit Log Artikel (Articles)
CREATE OR REPLACE FUNCTION public.log_article_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_action TEXT;
  v_note TEXT;
  v_final_actor_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created_' || NEW.status;
    v_note := 'Artikel dibuat dengan status ' || NEW.status;
    v_final_actor_id := CASE WHEN v_actor_id IS NOT NULL THEN v_actor_id ELSE NEW.author_id END;

    INSERT INTO public.article_audit_log (
      article_id, article_title, author_id, actor_id, action, note, created_at
    )
    VALUES (
      NEW.id, NEW.title, NEW.author_id, v_final_actor_id, v_action, v_note, now()
    );
  ELSIF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status) THEN
    v_action := 'status_' || NEW.status;
    v_note := CASE 
      WHEN NEW.review_note IS NOT NULL THEN NEW.review_note 
      ELSE ('Perubahan status dari ' || OLD.status || ' ke ' || NEW.status) 
    END;
    v_final_actor_id := CASE 
      WHEN v_actor_id IS NOT NULL THEN v_actor_id 
      WHEN NEW.reviewed_by IS NOT NULL THEN NEW.reviewed_by 
      ELSE NEW.author_id 
    END;

    INSERT INTO public.article_audit_log (
      article_id, article_title, author_id, actor_id, action, note, created_at
    )
    VALUES (
      NEW.id, NEW.title, NEW.author_id, v_final_actor_id, v_action, v_note, now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_article_status ON public.articles;
CREATE TRIGGER trg_log_article_status
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW EXECUTE PROCEDURE public.log_article_status_changes();

REVOKE ALL ON FUNCTION public.log_article_status_changes() FROM PUBLIC, anon, authenticated;


-- 3. Perbaiki Trigger Audit Log Revisi (Article Revisions)
CREATE OR REPLACE FUNCTION public.log_revision_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_action TEXT;
  v_note TEXT;
  v_final_actor_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'revision_created_' || NEW.status;
    v_note := 'Revisi dibuat dengan status ' || NEW.status;
    v_final_actor_id := CASE WHEN v_actor_id IS NOT NULL THEN v_actor_id ELSE NEW.author_id END;

    INSERT INTO public.article_audit_log (
      article_id, article_title, author_id, actor_id, action, note, created_at
    )
    VALUES (
      NEW.article_id, NEW.title, NEW.author_id, v_final_actor_id, v_action, v_note, now()
    );
  ELSIF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status) THEN
    v_action := 'revision_' || NEW.status;
    v_note := CASE 
      WHEN NEW.review_note IS NOT NULL THEN NEW.review_note 
      ELSE ('Perubahan status revisi dari ' || OLD.status || ' ke ' || NEW.status) 
    END;
    v_final_actor_id := CASE 
      WHEN v_actor_id IS NOT NULL THEN v_actor_id 
      WHEN NEW.reviewed_by IS NOT NULL THEN NEW.reviewed_by 
      ELSE NEW.author_id 
    END;

    INSERT INTO public.article_audit_log (
      article_id, article_title, author_id, actor_id, action, note, created_at
    )
    VALUES (
      NEW.article_id, NEW.title, NEW.author_id, v_final_actor_id, v_action, v_note, now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_revision_status ON public.article_revisions;
CREATE TRIGGER trg_log_revision_status
  AFTER INSERT OR UPDATE ON public.article_revisions
  FOR EACH ROW EXECUTE PROCEDURE public.log_revision_status_changes();

REVOKE ALL ON FUNCTION public.log_revision_status_changes() FROM PUBLIC, anon, authenticated;


-- 4. Perbaiki Fungsi Like Log Artikel & Berita (Bebas COALESCE UUID)
CREATE OR REPLACE FUNCTION public.check_article_liked(p_article_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_user_id END;
  v_device_id TEXT := trim(substring(coalesce(p_device_id, '') from 1 for 100));
BEGIN
  IF to_regclass('public.article_like_logs') IS NULL THEN RETURN false; END IF;
  IF v_user_id IS NOT NULL THEN
    RETURN EXISTS (SELECT 1 FROM public.article_like_logs WHERE article_id = p_article_id AND user_id = v_user_id);
  END IF;
  IF length(v_device_id) >= 5 THEN
    RETURN EXISTS (SELECT 1 FROM public.article_like_logs WHERE article_id = p_article_id AND device_id = v_device_id AND user_id IS NULL);
  END IF;
  RETURN false;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_article_liked(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_article_liked(UUID, TEXT, UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.toggle_article_like(p_article_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_user_id END;
  v_device_id TEXT := trim(substring(coalesce(p_device_id, '') from 1 for 100));
  v_already_liked BOOLEAN;
BEGIN
  IF to_regclass('public.article_like_logs') IS NULL OR to_regclass('public.articles') IS NULL THEN RETURN false; END IF;
  IF length(v_device_id) < 5 AND v_user_id IS NULL THEN RETURN false; END IF;
  v_already_liked := public.check_article_liked(p_article_id, v_device_id, v_user_id);
  IF v_already_liked THEN
    IF v_user_id IS NOT NULL THEN
      DELETE FROM public.article_like_logs WHERE article_id = p_article_id AND user_id = v_user_id;
    ELSE
      DELETE FROM public.article_like_logs WHERE article_id = p_article_id AND device_id = v_device_id AND user_id IS NULL;
    END IF;
    PERFORM set_config('app.allow_stats_update', 'true', true);
    UPDATE public.articles SET likes = GREATEST(0, likes - 1) WHERE id = p_article_id;
    RETURN false;
  ELSE
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.article_like_logs (article_id, device_id, user_id) VALUES (p_article_id, v_device_id, v_user_id)
      ON CONFLICT (article_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
    ELSE
      INSERT INTO public.article_like_logs (article_id, device_id, user_id) VALUES (p_article_id, v_device_id, NULL)
      ON CONFLICT (article_id, device_id) WHERE user_id IS NULL DO NOTHING;
    END IF;
    IF FOUND THEN
      PERFORM set_config('app.allow_stats_update', 'true', true);
      UPDATE public.articles SET likes = likes + 1 WHERE id = p_article_id;
    END IF;
    RETURN true;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.toggle_article_like(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_article_like(UUID, TEXT, UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.check_berita_liked(p_berita_id uuid, p_device_id text, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_user_id END;
  v_device_id TEXT := trim(substring(coalesce(p_device_id, '') from 1 for 100));
BEGIN
  IF to_regclass('public.berita_like_logs') IS NULL THEN RETURN false; END IF;
  IF v_user_id IS NOT NULL THEN
    RETURN EXISTS (SELECT 1 FROM public.berita_like_logs WHERE berita_id = p_berita_id AND user_id = v_user_id);
  END IF;
  IF length(v_device_id) >= 5 THEN
    RETURN EXISTS (SELECT 1 FROM public.berita_like_logs WHERE berita_id = p_berita_id AND device_id = v_device_id AND user_id IS NULL);
  END IF;
  RETURN false;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_berita_liked(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_berita_liked(uuid, text, uuid) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.toggle_berita_like(p_berita_id uuid, p_device_id text, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_user_id END;
  v_device_id TEXT := trim(substring(coalesce(p_device_id, '') from 1 for 100));
  already_liked boolean;
BEGIN
  IF to_regclass('public.berita_like_logs') IS NULL OR to_regclass('public.berita') IS NULL THEN RETURN false; END IF;
  IF length(v_device_id) < 5 AND v_user_id IS NULL THEN RETURN false; END IF;
  already_liked := public.check_berita_liked(p_berita_id, v_device_id, v_user_id);
  IF already_liked THEN
    IF v_user_id IS NOT NULL THEN
      DELETE FROM public.berita_like_logs WHERE berita_id = p_berita_id AND user_id = v_user_id;
    ELSE
      DELETE FROM public.berita_like_logs WHERE berita_id = p_berita_id AND device_id = v_device_id AND user_id IS NULL;
    END IF;
    PERFORM set_config('app.allow_stats_update', 'true', true);
    UPDATE public.berita SET likes = GREATEST(0, likes - 1) WHERE id = p_berita_id;
    RETURN false;
  ELSE
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.berita_like_logs (berita_id, device_id, user_id) VALUES (p_berita_id, v_device_id, v_user_id)
      ON CONFLICT (berita_id, user_id) WHERE user_id IS NOT NULL DO NOTHING;
    ELSE
      INSERT INTO public.berita_like_logs (berita_id, device_id, user_id) VALUES (p_berita_id, v_device_id, NULL)
      ON CONFLICT (berita_id, device_id) WHERE user_id IS NULL DO NOTHING;
    END IF;
    IF FOUND THEN
      PERFORM set_config('app.allow_stats_update', 'true', true);
      UPDATE public.berita SET likes = likes + 1 WHERE id = p_berita_id;
    END IF;
    RETURN true;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.toggle_berita_like(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_berita_like(uuid, text, uuid) TO anon, authenticated;
