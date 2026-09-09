-- ==========================================
-- BEM STMIK TAZKIA - NEW SUPABASE SCHEMA
-- Contains ONLY tables required for BEM Website
-- ==========================================

-- 1. Create `profiles` table for RBAC
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user' NOT NULL,
  full_name TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function and trigger to auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  assigned_role TEXT := 'user';
BEGIN
  -- 1. Domain Restriction Check
  IF new.email NOT LIKE '%@tazkia.ac.id' AND new.email NOT LIKE '%@stmik.tazkia.ac.id' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya email kampus (@tazkia.ac.id / @stmik.tazkia.ac.id) yang diizinkan.';
  END IF;

  -- 2. Auto-assign Admin Role
  IF new.email = 'bem@stmik.tazkia.ac.id' THEN
    assigned_role := 'admin';
  END IF;

  -- 3. Create Profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', assigned_role);
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create `berita` table
CREATE TABLE IF NOT EXISTS public.berita (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author TEXT DEFAULT 'Humas BEM STMIK Tazkia',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.berita_likes_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    berita_id UUID REFERENCES public.berita(id) ON DELETE CASCADE,
    user_id UUID, 
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(berita_id, user_id),
    UNIQUE(berita_id, ip_address)
);

CREATE TABLE IF NOT EXISTS public.berita_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    berita_id UUID REFERENCES public.berita(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(berita_id, ip_address)
);

ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita_likes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita_views_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public berita are viewable by everyone." ON public.berita FOR SELECT USING (true);
CREATE POLICY "Admins can insert berita." ON public.berita FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update berita." ON public.berita FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete berita." ON public.berita FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow public insert to berita likes" ON public.berita_likes_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on berita likes" ON public.berita_likes_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert to berita views" ON public.berita_views_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on berita views" ON public.berita_views_log FOR SELECT USING (true);


-- 3. Create `agendas` table
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'event' or 'volunteer'
  date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  registration_link TEXT,
  status TEXT DEFAULT 'upcoming',
  description TEXT,
  speaker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public agendas are viewable by everyone." ON public.agendas FOR SELECT USING (true);
CREATE POLICY "Admins can insert agendas." ON public.agendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update agendas." ON public.agendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete agendas." ON public.agendas FOR DELETE TO authenticated USING (true);


-- 4. Create `kabinet_profiles` table
CREATE TABLE IF NOT EXISTS public.kabinet_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL,
    nama_kabinet TEXT NOT NULL,
    visi TEXT,
    misi JSONB DEFAULT '[]'::jsonb,
    pengurus_inti JSONB DEFAULT '[]'::jsonb,
    proker_utama JSONB DEFAULT '[]'::jsonb,
    departemen JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.kabinet_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.kabinet_profiles FOR SELECT USING (true);
CREATE POLICY "Admins can insert kabinet profiles." ON public.kabinet_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update kabinet profiles." ON public.kabinet_profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete kabinet profiles." ON public.kabinet_profiles FOR DELETE TO authenticated USING (true);


-- 5. Create `saran_aduan` table
CREATE TABLE IF NOT EXISTS public.saran_aduan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subjek TEXT NOT NULL,
    kategori TEXT NOT NULL,
    pesan TEXT NOT NULL,
    nama TEXT, 
    kontak TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saran_aduan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public to insert saran" ON public.saran_aduan FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated to read saran" ON public.saran_aduan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to delete saran" ON public.saran_aduan FOR DELETE TO authenticated USING (true);


-- 6. Create `site_visitors` table
CREATE TABLE IF NOT EXISTS public.site_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS site_visitors_session_path_idx ON public.site_visitors (session_id, path);

ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert visitors" ON public.site_visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated select visitors" ON public.site_visitors FOR SELECT TO authenticated USING (true);


-- 7. Create `system_settings` table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings are viewable by everyone" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update settings" ON public.system_settings FOR UPDATE TO authenticated USING (true);


-- 8. Create `translations_cache` table
CREATE TABLE IF NOT EXISTS public.translations_cache (
  key TEXT PRIMARY KEY,
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public translations are viewable by everyone" ON public.translations_cache FOR SELECT USING (true);
CREATE POLICY "Admins can insert translations" ON public.translations_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update translations" ON public.translations_cache FOR UPDATE TO authenticated USING (true);


-- 9. Create `volunteer_applications` table
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id UUID REFERENCES public.agendas(id) ON DELETE CASCADE,
    nama_lengkap TEXT NOT NULL,
    nim TEXT NOT NULL,
    program_studi TEXT NOT NULL,
    angkatan TEXT NOT NULL,
    no_whatsapp TEXT NOT NULL,
    alasan_bergabung TEXT NOT NULL,
    pengalaman TEXT,
    portofolio_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public to insert application" ON public.volunteer_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated to view applications" ON public.volunteer_applications FOR SELECT TO authenticated USING (true);


-- 10. Setup Storage for `public_images`
INSERT INTO storage.buckets (id, name, public) VALUES ('public_images', 'public_images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'public_images');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public_images');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'public_images');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'public_images');
