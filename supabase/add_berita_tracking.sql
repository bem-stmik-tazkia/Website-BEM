-- ============================================================================
-- ANTI-SPAM LOG TABLES FOR BERITA
-- ============================================================================

-- Tabel log untuk mencatat siapa yang sudah like berita
CREATE TABLE IF NOT EXISTS public.berita_likes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    berita_id UUID REFERENCES public.berita(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index agar pengecekan cepat (hanya butuh sekian milidetik)
CREATE INDEX IF NOT EXISTS idx_berita_likes_log ON public.berita_likes_log(berita_id, device_id);

-- Tabel log untuk mencatat siapa yang sudah view berita (agar tidak spam refresh)
CREATE TABLE IF NOT EXISTS public.berita_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    berita_id UUID REFERENCES public.berita(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_berita_views_log ON public.berita_views_log(berita_id, device_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Fungsi 1: Mengecek apakah device sudah pernah nge-like berita ini
CREATE OR REPLACE FUNCTION check_berita_liked(p_berita_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    is_liked BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.berita_likes_log 
        WHERE berita_id = p_berita_id 
          AND (device_id = p_device_id OR (user_id IS NOT NULL AND user_id = p_user_id))
    ) INTO is_liked;
    
    RETURN is_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Fungsi 2: Menambah view (Dengan proteksi cooldown 24 Jam agar tidak bisa dispam)
CREATE OR REPLACE FUNCTION increment_berita_view(p_berita_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    has_viewed BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.berita_views_log 
        WHERE berita_id = p_berita_id 
          AND (device_id = p_device_id OR (user_id IS NOT NULL AND user_id = p_user_id))
    ) INTO has_viewed;

    IF NOT has_viewed THEN
        INSERT INTO public.berita_views_log (berita_id, device_id, user_id) 
        VALUES (p_berita_id, p_device_id, p_user_id);
        
        UPDATE public.berita 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = p_berita_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Fungsi 3: Toggle Like (Menambah/Mengurangi like secara aman)
CREATE OR REPLACE FUNCTION toggle_berita_like(p_berita_id UUID, p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    is_liked BOOLEAN;
BEGIN
    -- Cek status like saat ini
    SELECT EXISTS (
        SELECT 1 
        FROM public.berita_likes_log 
        WHERE berita_id = p_berita_id 
          AND (device_id = p_device_id OR (user_id IS NOT NULL AND user_id = p_user_id))
    ) INTO is_liked;

    IF is_liked THEN
        -- Batal Like (Hapus dari log dan kurangi angka)
        DELETE FROM public.berita_likes_log 
        WHERE berita_id = p_berita_id 
          AND (device_id = p_device_id OR (user_id IS NOT NULL AND user_id = p_user_id));
          
        UPDATE public.berita 
        SET likes = GREATEST(0, COALESCE(likes, 0) - 1) 
        WHERE id = p_berita_id;
        
        RETURN FALSE;
    ELSE
        -- Tambah Like (Catat ke log dan tambah angka)
        INSERT INTO public.berita_likes_log (berita_id, device_id, user_id) 
        VALUES (p_berita_id, p_device_id, p_user_id);
        
        UPDATE public.berita 
        SET likes = COALESCE(likes, 0) + 1 
        WHERE id = p_berita_id;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
