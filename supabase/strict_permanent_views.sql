-- ============================================================================
-- STRICT PERMANENT UNIQUE VIEW TRACKING (NO TIME RESET / COOLDOWN)
-- 1 Device / 1 User = 1 View PERMANENTLY (Bebas Spam 100%)
-- ============================================================================

-- 1. Update increment_karya_view agar Permanen (Hanya 1 kali per Device/User selamanya)
CREATE OR REPLACE FUNCTION public.increment_karya_view(p_karya_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_viewed boolean;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.karya_views_log 
            WHERE karya_id = p_karya_id AND user_id = p_user_id
        ) INTO has_viewed;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM public.karya_views_log 
            WHERE karya_id = p_karya_id AND device_id = p_device_id
        ) INTO has_viewed;
    END IF;

    -- Hanya tambah view jika BELUM PERNAH melihat selamanya
    IF NOT has_viewed THEN
        INSERT INTO public.karya_views_log (karya_id, device_id, user_id) 
        VALUES (p_karya_id, COALESCE(p_device_id, 'unknown'), p_user_id);
        
        UPDATE public.karya SET views = COALESCE(views, 0) + 1 WHERE id = p_karya_id;
    END IF;
END;
$$;


-- 2. Update increment_berita_view agar Permanen (Hanya 1 kali per Device/User selamanya)
CREATE OR REPLACE FUNCTION public.increment_berita_view(p_berita_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_viewed boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.berita_views_log 
        WHERE berita_id = p_berita_id 
          AND (device_id = p_device_id OR (user_id IS NOT NULL AND user_id = p_user_id))
    ) INTO has_viewed;

    -- Hanya tambah view jika BELUM PERNAH melihat selamanya
    IF NOT has_viewed THEN
        INSERT INTO public.berita_views_log (berita_id, device_id, user_id) 
        VALUES (p_berita_id, p_device_id, p_user_id);
        
        UPDATE public.berita 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = p_berita_id;
    END IF;
END;
$$;
