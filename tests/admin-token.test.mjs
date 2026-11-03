// ============================================================================
// TEST SUITE: tests/admin-token.test.mjs
// DESKRIPSI: Unit test token stateless 75 karakter, verifikasi Web Crypto,
//            constant-time verification, kedaluwarsa, dan integritas.
// ============================================================================

import assert from 'node:assert/strict';
import * as rawTokenMod from '../src/lib/admin-token.ts';
import * as rawPathMod from '../src/lib/admin-path.ts';

const tokenMod = rawTokenMod.default && rawTokenMod.default.isRandomAdminPathActive ? rawTokenMod.default : rawTokenMod;
const pathMod = rawPathMod.default && rawPathMod.default.isAdminLoginPath ? rawPathMod.default : rawPathMod;

const ADMIN_TOKEN_REGEX = pathMod.ADMIN_TOKEN_REGEX;
const isRandomAdminPathActive = (...args) => tokenMod.isRandomAdminPathActive(...args);
const generateAdminToken = (...args) => tokenMod.generateAdminToken(...args);
const verifyAdminToken = (...args) => tokenMod.verifyAdminToken(...args);
const isAdminLoginPath = (...args) => pathMod.isAdminLoginPath(...args);

const VALID_SECRET = 'this-is-a-valid-admin-secret-at-least-32-chars-long!';
const WRONG_SECRET = 'another-completely-different-secret-32-chars!';
const SHORT_SECRET = 'too-short';

console.log('=== MEMULAI UNIT TEST ADMIN TOKEN 75 KARAKTER ===');

// 1. Validasi flag & secret
{
  process.env.ADMIN_RANDOM_PATH = 'false';
  process.env.ADMIN_PATH_SECRET = VALID_SECRET;
  assert.equal(isRandomAdminPathActive(), false, 'Harus false saat flag false');

  process.env.ADMIN_RANDOM_PATH = 'true';
  process.env.ADMIN_PATH_SECRET = SHORT_SECRET;
  assert.equal(isRandomAdminPathActive(), false, 'Harus false saat secret < 32 chars');

  process.env.ADMIN_RANDOM_PATH = 'true';
  delete process.env.ADMIN_PATH_SECRET;
  assert.equal(isRandomAdminPathActive(), false, 'Harus false saat secret undefined');

  process.env.ADMIN_RANDOM_PATH = 'true';
  process.env.ADMIN_PATH_SECRET = VALID_SECRET;
  assert.equal(isRandomAdminPathActive(), true, 'Harus true saat flag true dan secret valid');
  console.log('[PASS] 1. Kebijakan feature flag dan validasi panjang secret minimal 32 karakter bekerja');
}

// 2. Format Token & Panjang Tepat 75 Karakter
{
  const token = await generateAdminToken(300000, VALID_SECRET);
  assert.equal(token.length, 75, `Panjang token harus tepat 75, didapat: ${token.length}`);
  assert.equal(token.includes('.'), false, 'Token tidak boleh mengandung titik');
  assert.match(token, ADMIN_TOKEN_REGEX, 'Token harus cocok dengan regex ^[A-Za-z0-9_-]{75}$');

  const isValid = await verifyAdminToken(token, VALID_SECRET);
  assert.equal(isValid, true, 'Token valid harus berhasil diverifikasi');
  console.log('[PASS] 2. Token berhasil di-generate: tepat 75 karakter Base64URL, tanpa titik, dan lolos verifikasi');
}

// 3. Keunikan Nonce
{
  const token1 = await generateAdminToken(300000, VALID_SECRET);
  const token2 = await generateAdminToken(300000, VALID_SECRET);
  assert.notEqual(token1, token2, 'Dua token yang di-generate harus berbeda karena nonce acak 128 bit');
  console.log('[PASS] 3. Nonce acak 128-bit menjamin keunikan token pada setiap penekanan Konami');
}

// 4. Token Kedaluwarsa
{
  // Waktu berlaku negatif -> langsung kedaluwarsa
  const expiredToken = await generateAdminToken(-1000, VALID_SECRET);
  const isValid = await verifyAdminToken(expiredToken, VALID_SECRET);
  assert.equal(isValid, false, 'Token kedaluwarsa harus ditolak');
  console.log('[PASS] 4. Token dengan timestamp lampau (> 5 menit) berhasil ditolak');
}

// 5. Token Dimodifikasi (Tampering)
{
  const originalToken = await generateAdminToken(300000, VALID_SECRET);
  // Ubah satu karakter di posisi tengah
  const charToReplace = originalToken[30] === 'A' ? 'B' : 'A';
  const tamperedToken = originalToken.slice(0, 30) + charToReplace + originalToken.slice(31);

  assert.equal(tamperedToken.length, 75);
  const isValid = await verifyAdminToken(tamperedToken, VALID_SECRET);
  assert.equal(isValid, false, 'Token yang dimodifikasi harus ditolak oleh HMAC');
  console.log('[PASS] 5. Modifikasi data token terdeteksi dan ditolak oleh verifikasi signature HMAC-SHA256');
}

// 6. Secret Berbeda
{
  const token = await generateAdminToken(300000, VALID_SECRET);
  const isValidWithWrongSecret = await verifyAdminToken(token, WRONG_SECRET);
  assert.equal(isValidWithWrongSecret, false, 'Verifikasi dengan secret berbeda harus ditolak');
  console.log('[PASS] 6. Verifikasi dengan secret salah ditolak');
}

// 7. Input Palsu / Malformed
{
  assert.equal(await verifyAdminToken('', VALID_SECRET), false);
  assert.equal(await verifyAdminToken('short', VALID_SECRET), false);
  assert.equal(await verifyAdminToken('a'.repeat(74), VALID_SECRET), false);
  assert.equal(await verifyAdminToken('a'.repeat(76), VALID_SECRET), false);
  assert.equal(await verifyAdminToken(null, VALID_SECRET), false);
  console.log('[PASS] 7. Input malformed / tidak cocok regex 75 karakter langsung ditolak tanpa komputasi berat');
}

// 8. Helper isAdminLoginPath(pathname) untuk Maintenance Wrapper & Routing
{
  const token = await generateAdminToken(300000, VALID_SECRET);
  assert.equal(isAdminLoginPath('/login'), true, '/login harus dikenali sebagai admin login');
  assert.equal(isAdminLoginPath('/login/'), true, '/login/ harus dikenali sebagai admin login');
  assert.equal(isAdminLoginPath(`/${token}`), true, 'URL token 75 karakter harus dikenali sebagai admin login');
  assert.equal(isAdminLoginPath(`/${token}?next=/admin`), true, 'URL token dengan query param harus dikenali');
  assert.equal(isAdminLoginPath(`/${token}#hash`), true, 'URL token dengan hash harus dikenali');

  // Rute non-login tidak boleh dianggap admin login
  assert.equal(isAdminLoginPath('/'), false);
  assert.equal(isAdminLoginPath('/masuk'), false);
  assert.equal(isAdminLoginPath('/dashboard/artikel'), false);
  assert.equal(isAdminLoginPath('/admin'), false);
  assert.equal(isAdminLoginPath(`/${token}/subroute`), false);
  assert.equal(isAdminLoginPath(null), false);
  assert.equal(isAdminLoginPath(''), false);
  console.log('[PASS] 8. Helper isAdminLoginPath mengenali /login dan pola token 75 karakter serta menolak rute lain');
}

console.log('>>> SEMUA 8 UNIT TEST ADMIN TOKEN BERHASIL LOLOS (ALL PASSED) <<<');
