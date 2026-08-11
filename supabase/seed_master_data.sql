-- Seed initial master data for Angkatan and Program Studi
-- Jalankan query ini satu kali di Supabase SQL Editor

INSERT INTO public.system_settings (key, value, updated_at)
VALUES 
  ('master_angkatan', '["1","2","3"]', now()),
  ('master_prodi', '["Teknik Informatika","Sistem Informasi","Bisnis Digital"]', now())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();
