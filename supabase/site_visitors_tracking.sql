-- ============================================================================
-- TABEL & FUNGSI PENGUNJUNG UTAMA WEBSITE (GENERAL SITE VISITORS)
-- Mencatat siapa saja yang membuka situs BEM (tanpa perlu mengklik berita/karya)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_site_visitors_device ON public.site_visitors(device_id);

-- RPC Function: Registrasi Pengunjung Utama (Cooldown 24 Jam)
CREATE OR REPLACE FUNCTION public.track_site_visitor(p_device_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_visit TIMESTAMP WITH TIME ZONE;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT created_at INTO last_visit 
        FROM public.site_visitors 
        WHERE user_id = p_user_id
        ORDER BY created_at DESC LIMIT 1;
    ELSE
        SELECT created_at INTO last_visit 
        FROM public.site_visitors 
        WHERE device_id = p_device_id
        ORDER BY created_at DESC LIMIT 1;
    END IF;

    -- Tambah pengunjung unik jika belum pernah berkunjung ATAU sudah lewat 24 jam
    IF last_visit IS NULL OR last_visit < NOW() - INTERVAL '24 hours' THEN
        INSERT INTO public.site_visitors (device_id, user_id) 
        VALUES (COALESCE(p_device_id, 'unknown'), p_user_id);
    END IF;
END;
$$;
