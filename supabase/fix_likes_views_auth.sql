-- 1. Tambahkan kolom user_id ke tabel log
ALTER TABLE public.karya_likes_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.karya_views_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop unique constraint lama pada karya_likes_log jika ada
ALTER TABLE public.karya_likes_log DROP CONSTRAINT IF EXISTS karya_likes_log_karya_id_device_id_key;

-- 3. Fungsi RPC untuk Mengecek Status Like (Bypass RLS)
CREATE OR REPLACE FUNCTION public.check_karya_liked(p_karya_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_liked boolean;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM public.karya_likes_log 
            WHERE karya_id = p_karya_id AND user_id = p_user_id
        ) INTO is_liked;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM public.karya_likes_log 
            WHERE karya_id = p_karya_id AND device_id = p_device_id
        ) INTO is_liked;
    END IF;
    
    RETURN is_liked;
END;
$$;

-- 4. Perbarui Fungsi RPC Toggle Like agar mendukung user_id
CREATE OR REPLACE FUNCTION public.toggle_karya_like(p_karya_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_like UUID;
BEGIN
    -- Cek berdasarkan user_id jika login, jika tidak berdasarkan device_id
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO existing_like 
        FROM public.karya_likes_log 
        WHERE karya_id = p_karya_id AND user_id = p_user_id;
    ELSE
        SELECT id INTO existing_like 
        FROM public.karya_likes_log 
        WHERE karya_id = p_karya_id AND device_id = p_device_id;
    END IF;

    IF existing_like IS NOT NULL THEN
        -- Batal Suka (Unlike)
        DELETE FROM public.karya_likes_log WHERE id = existing_like;
        UPDATE public.karya SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = p_karya_id;
        RETURN false;
    ELSE
        -- Suka (Like)
        INSERT INTO public.karya_likes_log (karya_id, device_id, user_id) 
        VALUES (p_karya_id, COALESCE(p_device_id, 'unknown'), p_user_id);
        UPDATE public.karya SET likes = COALESCE(likes, 0) + 1 WHERE id = p_karya_id;
        RETURN true;
    END IF;
END;
$$;

-- 5. Perbarui Fungsi RPC Increment View agar mendukung user_id
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

    IF NOT has_viewed THEN
        INSERT INTO public.karya_views_log (karya_id, device_id, user_id) 
        VALUES (p_karya_id, COALESCE(p_device_id, 'unknown'), p_user_id);
        
        UPDATE public.karya SET views = COALESCE(views, 0) + 1 WHERE id = p_karya_id;
    END IF;
END;
$$;
