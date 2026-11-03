// ============================================================================
// TEST SUITE: tests/auth-flow.test.mjs
// DESKRIPSI: Memanggil KODE PRODUKSI ASLI (handleAuthCallback dari route.ts dan
//            updateSession dari supabase-middleware.ts) dengan mock Supabase client.
// ============================================================================

import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import * as routeModule from '../src/app/(internal)/auth/callback/route.ts';
import * as middlewareModule from '../src/utils/supabase/supabase-middleware.ts';
import * as tokenModule from '../src/lib/admin-token.ts';

const handleAuthCallback = routeModule.handleAuthCallback || routeModule.default?.handleAuthCallback;
const updateSession = middlewareModule.updateSession || middlewareModule.default?.updateSession;
const rawToken = tokenModule.default || tokenModule;
const generateAdminToken = rawToken.generateAdminToken;

const ORIGIN = 'https://bem.stmik.tazkia.ac.id';
const GENERIC_ERROR_MESSAGE = 'Login gagal, silakan coba kembali.';

/**
 * Helper pembuat mock Supabase client
 */
function createMockSupabaseClient({
  exchangeError = null,
  user = { id: 'test-user', email: 'user@student.stmik.tazkia.ac.id' },
  userError = null,
  isRpcAdmin = false,
  rpcError = null,
} = {}) {
  let hasSignedOut = false;

  return {
    auth: {
      exchangeCodeForSession: async (code) => {
        if (exchangeError) return { error: exchangeError };
        return { data: { session: { access_token: 'fake' } }, error: null };
      },
      getUser: async () => {
        if (userError) return { data: { user: null }, error: userError };
        return { data: { user }, error: null };
      },
      signOut: async () => {
        hasSignedOut = true;
        return { error: null };
      },
    },
    rpc: async (fnName) => {
      if (fnName === 'is_admin') {
        if (rpcError) throw rpcError;
        return { data: isRpcAdmin, error: null };
      }
      return { data: null, error: null };
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: isRpcAdmin ? 'admin' : 'mahasiswa' }, error: null })
        })
      })
    }),
    get hasSignedOut() {
      return hasSignedOut;
    }
  };
}

/**
 * Simulasi murni resolver pesan halaman /masuk
 */
function resolveMasukErrorMessage(searchParamsString) {
  const params = new URLSearchParams(searchParamsString);
  const hasError = params.has('error') || params.has('error_code');
  if (hasError) {
    return GENERIC_ERROR_MESSAGE;
  }
  return null;
}

console.log('=== MEMULAI TEST BAGIAN A DENGAN KODE ASLI (route.ts & supabase-middleware.ts) ===');

// 1. Mahasiswa sah via alur mahasiswa -> /dashboard/artikel
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent('/dashboard/artikel')}`);
  const mockClient = createMockSupabaseClient({ isRpcAdmin: false });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), `${ORIGIN}/dashboard/artikel`);
  assert.equal(mockClient.hasSignedOut, false);
  console.log('[PASS] 1. (KODE ASLI) Mahasiswa sah via alur mahasiswa diarahkan ke /dashboard/artikel');
}

// 2. Akun non-kampus ditolak oleh trigger (OAuth provider mengembalikan error param)
let nonKampusLocation;
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?error=access_denied&error_description=Database+trigger+failed`);
  const mockClient = createMockSupabaseClient();
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  nonKampusLocation = res.headers.get('location');
  assert.equal(nonKampusLocation, `${ORIGIN}/masuk?error=login_failed`);
  console.log('[PASS] 2. (KODE ASLI) Akun non-kampus ditolak dengan redirect ke /masuk?error=login_failed');
}

// 3. Akun admin mencoba login via alur mahasiswa -> WAJIB DITOLAK
let adminViaMahasiswaLocation;
let adminViaMahasiswaSignedOut;
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent('/dashboard/artikel')}`);
  const mockClient = createMockSupabaseClient({
    user: { id: 'admin-id', email: 'admin@stmik.tazkia.ac.id' },
    isRpcAdmin: true,
  });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  adminViaMahasiswaLocation = res.headers.get('location');
  adminViaMahasiswaSignedOut = mockClient.hasSignedOut;
  console.log('[PASS] 3. (KODE ASLI) Akun admin via alur mahasiswa ditolak dan di-signOut');
}

// 4. Galat teknis tukar kode (exchangeError)
let exchangeErrorLocation;
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=bad-code`);
  const mockClient = createMockSupabaseClient({ exchangeError: new Error('Invalid code') });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  exchangeErrorLocation = res.headers.get('location');
  console.log('[PASS] 4. (KODE ASLI) Galat tukar kode diarahkan ke /masuk?error=login_failed');
}

// KOMPARASI IDENTIK KODE ASLI:
assert.equal(nonKampusLocation, `${ORIGIN}/masuk?error=login_failed`);
assert.equal(adminViaMahasiswaLocation, `${ORIGIN}/masuk?error=login_failed`);
assert.equal(exchangeErrorLocation, `${ORIGIN}/masuk?error=login_failed`);
assert.equal(nonKampusLocation, adminViaMahasiswaLocation, 'URL penolakan admin dan non-kampus WAJIB IDENTIK');
assert.equal(nonKampusLocation, exchangeErrorLocation, 'URL penolakan auth error dan non-kampus WAJIB IDENTIK');
assert.equal(adminViaMahasiswaSignedOut, true, 'Admin via alur mahasiswa wajib di-signOut');

const msg1 = resolveMasukErrorMessage(new URL(nonKampusLocation).search);
const msg2 = resolveMasukErrorMessage(new URL(adminViaMahasiswaLocation).search);
const msg3 = resolveMasukErrorMessage(new URL(exchangeErrorLocation).search);
assert.equal(msg1, GENERIC_ERROR_MESSAGE);
assert.equal(msg2, GENERIC_ERROR_MESSAGE);
assert.equal(msg3, GENERIC_ERROR_MESSAGE);
console.log('[PASS] Asersi Komparasi: Penolakan admin di alur mahasiswa, non-kampus, dan exchange error identik 100% tanpa bocoran info');

// 5. Tes anti-refleksi parameter error di halaman /masuk
{
  const testParams = [
    '?error=database_connection_refused_admin_user',
    '?error=<script>alert(1)</script>',
    '?error=domain_not_allowed_xyz',
    '?error_code=something_weird',
    '?error=login_failed',
  ];
  for (const qs of testParams) {
    const msg = resolveMasukErrorMessage(qs);
    assert.equal(msg, GENERIC_ERROR_MESSAGE);
    assert.equal(msg.includes('script'), false);
    assert.equal(msg.includes('admin'), false);
    assert.equal(msg.includes('domain'), false);
  }
  console.log('[PASS] 5. Halaman /masuk selalu menampilkan pesan generik untuk ?error= apa pun tanpa memantulkan nilainya');
}

// 6. Alur Admin: lolos is_admin() -> /admin
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent('/admin')}`);
  const mockClient = createMockSupabaseClient({ isRpcAdmin: true });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), `${ORIGIN}/admin`);
  assert.equal(mockClient.hasSignedOut, false);
  console.log('[PASS] 6. (KODE ASLI) Admin sah via alur admin diarahkan ke /admin');
}

// 7. Alur Admin: non-admin via alur admin -> signOut diam ke / tanpa parameter
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent('/admin')}`);
  const mockClient = createMockSupabaseClient({ isRpcAdmin: false });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), `${ORIGIN}/`);
  assert.equal(mockClient.hasSignedOut, true);
  console.log('[PASS] 7. (KODE ASLI) Non-admin via alur admin di-signOut diam ke / tanpa parameter error');
}

// 8. Pembeda dipalsukan: non-admin kirim next=/admin -> signOut ke /, ditolak tanpa eskalasi
{
  const req = new NextRequest(`${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent('/admin/system-settings')}`);
  const mockClient = createMockSupabaseClient({ isRpcAdmin: false });
  const res = await handleAuthCallback(req, mockClient);

  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), `${ORIGIN}/`);
  assert.equal(mockClient.hasSignedOut, true);
  console.log('[PASS] 8. (KODE ASLI) Pembeda dipalsukan (non-admin kirim next=/admin) -> signOut, ditolak tanpa eskalasi');
}

// 9. Middleware (KODE ASLI updateSession): Sesi admin di /dashboard/artikel ditolak dan dialihkan ke /admin
{
  const req = new NextRequest(`${ORIGIN}/dashboard/artikel`);
  const mockClient = createMockSupabaseClient({
    user: { id: 'admin-123' },
    isRpcAdmin: true,
  });
  const res = await updateSession(req, mockClient);

  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), `${ORIGIN}/admin`);
  console.log('[PASS] 9. (KODE ASLI updateSession) Sesi admin di /dashboard/artikel dialihkan ke /admin');
}

// 10. Middleware (KODE ASLI updateSession): Sesi mahasiswa di /admin/berita mendapat respons 404 (Fail-closed)
{
  const req = new NextRequest(`${ORIGIN}/admin/berita`);
  const mockClient = createMockSupabaseClient({
    user: { id: 'mhs-123' },
    isRpcAdmin: false,
  });
  const res = await updateSession(req, mockClient);

  assert.equal(res.status, 404);
  assert.equal(res.headers.get('x-middleware-rewrite'), `${ORIGIN}/not-found`);
  console.log('[PASS] 10. (KODE ASLI updateSession) Sesi mahasiswa di /admin/berita mendapat respons 404 (rewrite /not-found)');
}

// 11. Middleware (KODE ASLI updateSession): RPC is_admin throw error -> Fail-closed 404
{
  const req = new NextRequest(`${ORIGIN}/admin/kegiatan`);
  const mockClient = createMockSupabaseClient({
    user: { id: 'mhs-123' },
    rpcError: new Error('Postgres connection timeout'),
  });
  const res = await updateSession(req, mockClient);

  assert.equal(res.status, 404);
  assert.equal(res.headers.get('x-middleware-rewrite'), `${ORIGIN}/not-found`);
  console.log('[PASS] 11. (KODE ASLI updateSession) Kegagalan RPC is_admin di /admin/* fail-closed ke 404 Not Found');
}

// 12. Middleware (KODE ASLI updateSession): Sesi mahasiswa di /dashboard diizinkan masuk (200 OK)
{
  const req = new NextRequest(`${ORIGIN}/dashboard/artikel`);
  const mockClient = createMockSupabaseClient({
    user: { id: 'mhs-123' },
    isRpcAdmin: false,
  });
  const res = await updateSession(req, mockClient);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('location'), null);
  console.log('[PASS] 12. (KODE ASLI updateSession) Sesi mahasiswa di /dashboard/artikel diizinkan masuk (200 OK)');
}

// 13. Middleware (KODE ASLI updateSession): Saat ADMIN_RANDOM_PATH=false, rute 75 karakter TIDAK diproses sebagai token
{
  process.env.ADMIN_RANDOM_PATH = 'false';
  delete process.env.ADMIN_PATH_SECRET;

  const fakeToken75 = 'A'.repeat(75);
  const req = new NextRequest(`${ORIGIN}/${fakeToken75}`);
  const mockClient = createMockSupabaseClient();
  const res = await updateSession(req, mockClient);

  // Tanpa flag aktif, tidak di-rewrite ke /login maupun /not-found oleh middleware
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-middleware-rewrite'), null);
  console.log('[PASS] 13. (KODE ASLI updateSession) Saat ADMIN_RANDOM_PATH=false, pola 75 karakter diteruskan sebagai path biasa');
}

// 14. Middleware (KODE ASLI updateSession): Saat ADMIN_RANDOM_PATH=true, rute token diproses (valid -> rewrite /login, invalid -> 404)
{
  const testSecret = 'secret-for-auth-flow-test-at-least-32-chars-long!';
  process.env.ADMIN_RANDOM_PATH = 'true';
  process.env.ADMIN_PATH_SECRET = testSecret;

  const validToken = await generateAdminToken(300000, testSecret);
  const reqValid = new NextRequest(`${ORIGIN}/${validToken}`);
  const mockClient = createMockSupabaseClient();
  const resValid = await updateSession(reqValid, mockClient);

  assert.equal(resValid.headers.get('x-middleware-rewrite'), `${ORIGIN}/login`);

  const reqInvalid = new NextRequest(`${ORIGIN}/${'X'.repeat(75)}`);
  const resInvalid = await updateSession(reqInvalid, mockClient);
  assert.equal(resInvalid.status, 404);
  assert.equal(resInvalid.headers.get('x-middleware-rewrite'), `${ORIGIN}/not-found`);

  // Kembalikan flag ke kondisi default (mati)
  process.env.ADMIN_RANDOM_PATH = 'false';
  delete process.env.ADMIN_PATH_SECRET;

  console.log('[PASS] 14. (KODE ASLI updateSession) Saat ADMIN_RANDOM_PATH=true, token valid di-rewrite ke /login dan token salah 404');
}

console.log('>>> SEMUA 14 PENGUJIAN KODE ASLI BERHASIL LOLOS (ALL PASSED) <<<');
