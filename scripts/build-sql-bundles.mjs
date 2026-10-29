import fs from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const RLS_CHECKS_PATH = path.resolve('supabase/tests/rls_checks.sql');
const OUTPUT_DIR = path.resolve('supabase/bundles');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Baca seluruh file migrasi di supabase/migrations secara berurutan
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const migrationSql = migrationFiles
  .map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8').replace(/\r\n/g, '\n'))
  .join('\n\n-- ============================================================================\n\n');
const rlsChecksSql = fs.readFileSync(RLS_CHECKS_PATH, 'utf8').replace(/\r\n/g, '\n');

// 1. Ekstrak body pengujian dari rls_checks.sql (antara BEGIN; dan ROLLBACK;)
const beginMarker = '\nBEGIN;\n';
const rollbackMarker = '\nROLLBACK;\n';

const beginIndex = rlsChecksSql.indexOf(beginMarker);
const rollbackIndex = rlsChecksSql.lastIndexOf(rollbackMarker);

let rlsChecksBody = '';
if (beginIndex !== -1 && rollbackIndex !== -1) {
  rlsChecksBody = rlsChecksSql
    .substring(beginIndex + beginMarker.length, rollbackIndex)
    .trim()
    .replace(/'admin_test@placeholder\.local'/g, "'dryrun-admin@example.invalid'");
} else {
  // Fallback
  rlsChecksBody = rlsChecksSql
    .replace(/^BEGIN;\s*$/m, '')
    .replace(/^ROLLBACK;\s*$/m, '')
    .replace(/SELECT 'DRY RUN SELESAI[\s\S]*?;/g, '')
    .trim();
}

// 2. Query verifikasi terintegrasi dengan output PASS / FAIL via RAISE NOTICE
const verificationBlock = `
-- ============================================================================
-- VERIFIKASI AKHIR GLADI RESIK (HASIL DISAMPAIKAN LEWAT RAISE NOTICE)
-- ============================================================================
DO $$
DECLARE
  v_fail_count int := 0;
  v_rec RECORD;
  v_rpc_count int := 0;
  v_storage_count int := 0;
  v_unsecured_tables int := 0;
BEGIN
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'MEMULAI VERIFIKASI POST-MIGRATION GLADI RESIK:';
  RAISE NOTICE '------------------------------------------------------------';

  -- A. Periksa tabel di schema public yang belum memiliki RLS
  SELECT count(*) INTO v_unsecured_tables
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = false;

  IF v_unsecured_tables > 0 THEN
    v_fail_count := v_fail_count + 1;
    RAISE NOTICE '[FAIL] Terdapat % tabel di schema public TANPA RLS aktif!', v_unsecured_tables;
    FOR v_rec IN 
      SELECT t.tablename 
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
      WHERE t.schemaname = 'public' AND c.relrowsecurity = false
    LOOP
      RAISE NOTICE '       -> Tabel tanpa RLS: %', v_rec.tablename;
    END LOOP;
  ELSE
    RAISE NOTICE '[PASS] Seluruh tabel di schema public memiliki RLS aktif (rowsecurity = true).';
  END IF;

  -- B. Periksa Policy Publik / Anon yang berpotensi membahayakan
  -- Anon hanya boleh SELECT berita/agenda atau tanpa policy (default-deny)
  FOR v_rec IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    v_fail_count := v_fail_count + 1;
    RAISE NOTICE '[FAIL] Policy anon mengizinkan mutasi langsung: %.% (cmd: %)', v_rec.tablename, v_rec.policyname, v_rec.cmd;
  END LOOP;
  IF NOT FOUND THEN
    RAISE NOTICE '[PASS] Tidak ada policy INSERT/UPDATE/DELETE publik/anon di schema public.';
  END IF;

  -- C. Periksa RPC yang bisa dieksekusi oleh anon (harus tepat 5 whitelist RPC)
  SELECT count(*) INTO v_rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
    );

  IF v_rpc_count = 5 THEN
    RAISE NOTICE '[PASS] Tepat 5 RPC publik yang dapat dieksekusi role anon:';
    FOR v_rec IN
      SELECT p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
        )
      ORDER BY p.proname
    LOOP
      RAISE NOTICE '       -> RPC Whitelist: %', v_rec.proname;
    END LOOP;
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE NOTICE '[FAIL] Jumlah RPC anon tidak sesuai: ditemukan % (ekspektasi tepat 5)', v_rpc_count;
    FOR v_rec IN
      SELECT p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
        )
      ORDER BY p.proname
    LOOP
      RAISE NOTICE '       -> RPC: %', v_rec.proname;
    END LOOP;
  END IF;

  -- D. Periksa Policy pada storage.objects untuk bucket public_images
  IF to_regclass('storage.objects') IS NOT NULL THEN
    SELECT count(*) INTO v_storage_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN (
        'Public read public_images',
        'Admin write public_images',
        'Admin update public_images',
        'Admin delete public_images'
      );

    IF v_storage_count = 4 THEN
      RAISE NOTICE '[PASS] Policy storage.objects terpasang lengkap (4 policy untuk public_images).';
    ELSE
      v_fail_count := v_fail_count + 1;
      RAISE NOTICE '[FAIL] Policy storage.objects tidak lengkap: ditemukan % dari 4 policy.', v_storage_count;
    END IF;
  ELSE
    RAISE NOTICE '[NOTICE] Tabel storage.objects tidak ditemukan di lingkungan ini (dilewati).';
  END IF;

  -- E. Periksa Isolasi Tabel public.app_secrets (RLS aktif, 0 policy publik/anon, default-deny)
  IF to_regclass('public.app_secrets') IS NOT NULL THEN
    DECLARE
      v_sec_policy_count int := 0;
    BEGIN
      SELECT count(*) INTO v_sec_policy_count
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'app_secrets';

      IF v_sec_policy_count = 0 THEN
        RAISE NOTICE '[PASS] Tabel public.app_secrets terisolasi sempurna (RLS aktif, default-deny tanpa policy publik).';
      ELSE
        v_fail_count := v_fail_count + 1;
        RAISE NOTICE '[FAIL] Tabel public.app_secrets memiliki % policy (seharusnya 0 policy).', v_sec_policy_count;
      END IF;
    END;
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE NOTICE '[FAIL] Tabel public.app_secrets tidak ditemukan!';
  END IF;

  -- Ringkasan Akhir
  RAISE NOTICE '------------------------------------------------------------';
  IF v_fail_count = 0 THEN
    RAISE NOTICE '>>> GLADI RESIK SUKSES 100%%: SEMUA PENGUJIAN LOLOS (PASS) <<<';
  ELSE
    RAISE NOTICE '>>> GLADI RESIK SELESAI DENGAN % PERINGATAN/KEGAGALAN (FAIL) <<<', v_fail_count;
  END IF;
  RAISE NOTICE '------------------------------------------------------------';
END $$;
`;

// 3. Bangun File a: supabase/bundles/dry_run.sql
const dryRunBundle = `-- ============================================================================
-- JANGAN hapus ROLLBACK, JANGAN ganti dengan COMMIT
-- ============================================================================
-- FILE: supabase/bundles/dry_run.sql
-- TUJUAN: Gladi resik pengerasan keamanan & RBAC di database produksi/staging.
-- KEAMANAN: Seluruh transaksi di-ROLLBACK di baris terakhir, sehingga TIDAK ADA
--           DATA YANG BERUBAH ATAU TERSIMPAN DI DATABASE.
-- ============================================================================

SET client_min_messages = notice;

BEGIN;

-- ----------------------------------------------------------------------------
-- BAGIAN 1: EKSEKUSI MIGRASI PENGURUSAN RLS & RBAC
-- ----------------------------------------------------------------------------
${migrationSql}

-- ----------------------------------------------------------------------------
-- BAGIAN 2: DAFTARKAN ADMIN UJI DRY RUN
-- ----------------------------------------------------------------------------
INSERT INTO public.admins (email, created_at)
VALUES ('dryrun-admin@example.invalid', now())
ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- BAGIAN 3: SUITE PENGUJIAN OTOMATIS RLS & HAK AKSES (ASSERTION FAIL-CLOSED)
-- ----------------------------------------------------------------------------
${rlsChecksBody}

-- ----------------------------------------------------------------------------
-- BAGIAN 4: VERIFIKASI POST-MIGRATION DENGAN LAPORAN PASS/FAIL VIA RAISE NOTICE
-- ----------------------------------------------------------------------------
${verificationBlock}

-- ============================================================================
-- BATALKAN SELURUH PERUBAHAN TRANSAKSI GLADI RESIK
-- ============================================================================
ROLLBACK;

-- ============================================================================
-- STATUS HASIL AKHIR GLADI RESIK PASCA-ROLLBACK
-- ============================================================================
SELECT 'DRY RUN SELESAI: semua perubahan dibatalkan' AS status;

-- ============================================================================
-- QUERY PENGECEKAN PASCA-ROLLBACK (Jalankan terpisah untuk membuktikan DB bersih):
-- select to_regclass('public.admins');
-- EKSPEKTASI: NULL (Tabel admins tidak tersimpan karena transaksi di-rollback).
-- ============================================================================
-- JANGAN hapus ROLLBACK, JANGAN ganti dengan COMMIT
-- ============================================================================
`;

// 4. Bangun File b: supabase/bundles/apply_production.sql
const applyProductionBundle = `-- ============================================================================
-- FILE: supabase/bundles/apply_production.sql
-- TUJUAN: Eksekusi resmi pengerasan keamanan & RBAC di database produksi.
-- PETUNJUK: 
-- 1. Salin seluruh isi file ini ke Supabase Dashboard > SQL Editor.
-- 2. Ganti string 'GANTI_DENGAN_EMAIL_ADMIN' di Bagian 2 dengan email admin Google resmi.
-- 3. JANGAN SIMPAN ATAU COMMIT EMAIL ASLI KE GIT REPOSITORI!
-- 4. Klik tombol Run.
-- ============================================================================

SET client_min_messages = notice;

BEGIN;

-- ----------------------------------------------------------------------------
-- BAGIAN 1: EKSEKUSI MIGRASI PENGURUSAN RLS & RBAC
-- ----------------------------------------------------------------------------
${migrationSql}

-- ----------------------------------------------------------------------------
-- BAGIAN 2: PENDAFTARAN ADMINISTRATOR PRODUKSI
-- ----------------------------------------------------------------------------
INSERT INTO public.admins (email, created_at)
VALUES (lower('GANTI_DENGAN_EMAIL_ADMIN'), now())
ON CONFLICT (email) DO NOTHING;

-- Blok validasi pengaman (GAGAL TERTUTUP jika placeholder belum diganti)
DO $$
DECLARE
  v_admin_count int;
  v_has_placeholder boolean;
BEGIN
  SELECT count(*) INTO v_admin_count FROM public.admins;
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = 'ganti_dengan_email_admin' 
       OR email LIKE '%placeholder%' 
       OR email LIKE '%example%'
  ) INTO v_has_placeholder;

  IF v_admin_count = 0 OR v_has_placeholder THEN
    RAISE EXCEPTION 'Email admin belum diganti, seluruh migrasi dibatalkan! Silakan ganti GANTI_DENGAN_EMAIL_ADMIN dengan email asli sebelum menjalankan.';
  END IF;

  RAISE NOTICE '>>> Verifikasi Admin Sukses: % admin resmi terdaftar di public.admins.', v_admin_count;
END $$;

-- ----------------------------------------------------------------------------
-- BAGIAN 3: COMMIT TRANSAKSI PRODUKSI
-- ----------------------------------------------------------------------------
COMMIT;
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'dry_run.sql'), dryRunBundle, 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'apply_production.sql'), applyProductionBundle, 'utf8');

console.log('✅ Berhasil membuat bundle SQL:');
console.log('   - supabase/bundles/dry_run.sql');
console.log('   - supabase/bundles/apply_production.sql');
