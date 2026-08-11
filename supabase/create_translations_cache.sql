-- ============================================================
-- Tabel Cache Terjemahan Konten Dinamis
-- Menyimpan hasil terjemahan dari MyMemory API agar tidak
-- perlu request berulang (hemat kuota & lebih cepat)
-- ============================================================

CREATE TABLE IF NOT EXISTS translations_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    TEXT NOT NULL,       -- ID konten asli (UUID atau string unik)
  content_table TEXT NOT NULL,       -- Nama tabel sumber: 'berita', 'agenda_kegiatan', 'karya', dll
  field_name    TEXT NOT NULL,       -- Nama field: 'title', 'description', 'excerpt', 'category'
  source_lang   TEXT NOT NULL DEFAULT 'id',  -- Bahasa sumber
  target_lang   TEXT NOT NULL,       -- Bahasa tujuan: 'en', 'ar', 'fr', 'ja'
  translated_text TEXT NOT NULL,    -- Hasil terjemahan
  source_hash   TEXT,               -- Hash dari teks asli (untuk deteksi perubahan konten)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,         -- NULL = permanen, diisi untuk konten sementara (volunteer)

  -- Satu terjemahan unik per kombinasi konten + field + bahasa
  UNIQUE (content_id, content_table, field_name, target_lang)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_translations_content 
  ON translations_cache (content_id, content_table, target_lang);

CREATE INDEX IF NOT EXISTS idx_translations_expires
  ON translations_cache (expires_at)
  WHERE expires_at IS NOT NULL;

-- Row Level Security
ALTER TABLE translations_cache ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa baca cache (konten publik)
CREATE POLICY "translations_cache_select_all"
  ON translations_cache FOR SELECT
  USING (true);

-- Hanya service role yang bisa insert/update (via server-side)
CREATE POLICY "translations_cache_insert_service"
  ON translations_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "translations_cache_update_service"
  ON translations_cache FOR UPDATE
  USING (true);

CREATE POLICY "translations_cache_delete_service"
  ON translations_cache FOR DELETE
  USING (true);

-- ============================================================
-- Function untuk membersihkan cache yang sudah expired
-- Jalankan secara berkala (misal via Supabase CRON)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_translations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM translations_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
