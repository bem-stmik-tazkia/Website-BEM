-- Menambahkan kolom video_url ke tabel agendas
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS video_url TEXT;
