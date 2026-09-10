-- Menambahkan kolom Tanggal Selesai untuk mendukung rentang hari
ALTER TABLE public.agendas ADD COLUMN IF NOT EXISTS end_date date;
