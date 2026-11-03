// ============================================================================
// TEST SUITE: tests/admin-token-integration.test.mjs
// DESKRIPSI: Tes integrasi terhadap server Next.js produksi (next build + next start).
//            Menguji rute token 75 karakter, penolakan /login saat flag aktif,
//            aksesibilitas rute publik dan i18n, serta alur lama saat flag non-aktif.
// ============================================================================

import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import * as rawTokenMod from '../src/lib/admin-token.ts';

const tokenMod = rawTokenMod.default && rawTokenMod.default.generateAdminToken ? rawTokenMod.default : rawTokenMod;
const { generateAdminToken } = tokenMod;

const SECRET_VALID = 'integration-test-admin-secret-minimum-32-chars!';
const PORT_ACTIVE = 3088;
const PORT_INACTIVE = 3089;

function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGKILL');
    }
  } catch {
    // Abaikan jika sudah mati
  }
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Server pada ${url} gagal merespons dalam waktu ${timeoutMs}ms.`);
}

async function runTests() {
  console.log('=== MEMULAI TEST INTEGRASI NEXT BUILD + NEXT START ===\n');

  // --------------------------------------------------------------------------
  // SKENARIO 1: ADMIN_RANDOM_PATH=true
  // --------------------------------------------------------------------------
  console.log(`[Skenario 1] Menjalankan next start pada port ${PORT_ACTIVE} (Flag AKTIF)...`);
  const envActive = {
    ...process.env,
    PORT: String(PORT_ACTIVE),
    ADMIN_RANDOM_PATH: 'true',
    ADMIN_PATH_SECRET: SECRET_VALID,
  };

  const procActive = spawn('npx', ['next', 'start', '-p', String(PORT_ACTIVE)], {
    env: envActive,
    shell: true,
    stdio: 'ignore',
  });

  try {
    const baseUrl = `http://localhost:${PORT_ACTIVE}`;
    await waitForServer(baseUrl);
    console.log(`[Skenario 1] Server berjalan di ${baseUrl}\n`);

    // 1.1 Token Valid 75 Karakter -> 200 OK (Render halaman login admin)
    const validToken = await generateAdminToken(300000, SECRET_VALID);
    const resValid = await fetch(`${baseUrl}/${validToken}`, { redirect: 'manual' });
    const textValid = await resValid.text();
    assert.equal(resValid.status, 200, `Token valid harus return 200, didapat: ${resValid.status}`);
    assert.ok(
      textValid.includes('Portal Admin BEM') || textValid.includes('login') || textValid.includes('Google'),
      'Halaman login admin harus ter-render saat token valid'
    );
    console.log('[PASS] 1.1 Token valid 75 karakter -> HTTP 200 (halaman login admin)');

    // 1.2 Token Dimodifikasi (Tampered) -> 404 Not Found
    const tamperedToken = validToken.slice(0, -1) + (validToken.slice(-1) === 'A' ? 'B' : 'A');
    const resTampered = await fetch(`${baseUrl}/${tamperedToken}`, { redirect: 'manual' });
    assert.equal(resTampered.status, 404, `Token modifikasi harus 404, didapat: ${resTampered.status}`);
    console.log('[PASS] 1.2 Token dimodifikasi -> HTTP 404');

    // 1.3 Token Kedaluwarsa -> 404 Not Found
    const expiredToken = await generateAdminToken(-10000, SECRET_VALID); // lampau
    const resExpired = await fetch(`${baseUrl}/${expiredToken}`, { redirect: 'manual' });
    assert.equal(resExpired.status, 404, `Token kedaluwarsa harus 404, didapat: ${resExpired.status}`);
    console.log('[PASS] 1.3 Token kedaluwarsa -> HTTP 404');

    // 1.4 Token Palsu / Acak 75 Karakter -> 404 Not Found
    const fakeToken = 'A'.repeat(75);
    const resFake = await fetch(`${baseUrl}/${fakeToken}`, { redirect: 'manual' });
    assert.equal(resFake.status, 404, `Token acak palsu harus 404, didapat: ${resFake.status}`);
    console.log('[PASS] 1.4 Token acak palsu -> HTTP 404');

    // 1.5 Akses Langsung /login saat flag aktif -> 404 Not Found
    const resLoginDirect = await fetch(`${baseUrl}/login`, { redirect: 'manual' });
    assert.equal(resLoginDirect.status, 404, `Akses langsung /login saat flag aktif harus 404, didapat: ${resLoginDirect.status}`);
    console.log('[PASS] 1.5 Akses langsung /login saat flag aktif -> HTTP 404');

    // 1.6 Rute Beranda (/) -> 200 atau 307/308 redirect ke locale (/id)
    const resRoot = await fetch(`${baseUrl}/`, { redirect: 'manual' });
    assert.ok(
      resRoot.status === 200 || resRoot.status === 307 || resRoot.status === 308,
      `Rute root harus 200 atau redirect locale, didapat: ${resRoot.status}`
    );
    console.log(`[PASS] 1.6 Rute root (/) tidak terganggu (status: ${resRoot.status})`);

    // 1.7 Rute Locale (/id dan /en) -> 200 OK
    const resId = await fetch(`${baseUrl}/id`, { redirect: 'manual' });
    assert.equal(resId.status, 200, `Rute /id harus 200, didapat: ${resId.status}`);
    const resEn = await fetch(`${baseUrl}/en`, { redirect: 'manual' });
    assert.equal(resEn.status, 200, `Rute /en harus 200, didapat: ${resEn.status}`);
    console.log('[PASS] 1.7 Rute locale (/id dan /en) berjalan normal');

    // 1.8 Rute Berita (/id/berita atau /berita) -> 200 OK
    const resBerita = await fetch(`${baseUrl}/id/berita`, { redirect: 'manual' });
    assert.equal(resBerita.status, 200, `Rute /id/berita harus 200, didapat: ${resBerita.status}`);
    console.log('[PASS] 1.8 Rute konten publik (/id/berita) berjalan normal');

    // 1.9 Rute /masuk -> 200 OK
    const resMasuk = await fetch(`${baseUrl}/masuk`, { redirect: 'manual' });
    assert.equal(resMasuk.status, 200, `Rute /masuk harus 200, didapat: ${resMasuk.status}`);
    console.log('[PASS] 1.9 Rute login mahasiswa (/masuk) berjalan normal');

    // 1.10 Rute /dashboard/artikel anonim -> 307 Redirect ke /masuk
    const resDashboard = await fetch(`${baseUrl}/dashboard/artikel`, { redirect: 'manual' });
    assert.equal(resDashboard.status, 307, `Akses anonim ke /dashboard/artikel harus 307, didapat: ${resDashboard.status}`);
    const location = resDashboard.headers.get('location');
    assert.ok(location && location.includes('/masuk'), `Redirect harus ke /masuk, didapat: ${location}`);
    console.log('[PASS] 1.10 Proteksi rute /dashboard/* mengarahkan pengunjung anonim ke /masuk');

  } finally {
    killProcess(procActive);
    console.log(`\n[Skenario 1] Server pada port ${PORT_ACTIVE} dihentikan.`);
  }

  // --------------------------------------------------------------------------
  // SKENARIO 2: ADMIN_RANDOM_PATH=false (Perilaku Lama)
  // --------------------------------------------------------------------------
  console.log(`\n[Skenario 2] Menjalankan next start pada port ${PORT_INACTIVE} (Flag NON-AKTIF)...`);
  const envInactive = {
    ...process.env,
    PORT: String(PORT_INACTIVE),
    ADMIN_RANDOM_PATH: 'false',
  };
  delete envInactive.ADMIN_PATH_SECRET;

  const procInactive = spawn('npx', ['next', 'start', '-p', String(PORT_INACTIVE)], {
    env: envInactive,
    shell: true,
    stdio: 'ignore',
  });

  try {
    const baseUrlInactive = `http://localhost:${PORT_INACTIVE}`;
    await waitForServer(baseUrlInactive);
    console.log(`[Skenario 2] Server berjalan di ${baseUrlInactive}\n`);

    // 2.1 Akses langsung /login tanpa cookie bypass -> 307 redirect ke / (Perilaku Asli)
    const resLoginDirect = await fetch(`${baseUrlInactive}/login`, { redirect: 'manual' });
    assert.equal(resLoginDirect.status, 307, `Tanpa cookie bypass, /login harus redirect 307 ke /, didapat: ${resLoginDirect.status}`);
    const locLogin = resLoginDirect.headers.get('location');
    assert.ok(locLogin && (locLogin.endsWith('/') || locLogin.includes('/id')), `Redirect harus ke beranda, didapat: ${locLogin}`);
    console.log('[PASS] 2.1 Akses langsung /login tanpa bypass cookie diarahkan ke beranda (HTTP 307 - Perilaku Lama)');

    // 2.2 Akses /login DENGAN cookie bypass Konami -> 200 OK (Halaman Login Admin Terbuka)
    const bypassCookieVal = process.env.MAINTENANCE_BYPASS_SECRET || '0i5vHFm1p62SutNbbPluljVP_3_GXr71iIwNXYXLnsU';
    const resLoginWithBypass = await fetch(`${baseUrlInactive}/login`, {
      headers: {
        Cookie: `maintenance_bypass=${bypassCookieVal}`,
      },
      redirect: 'manual',
    });
    assert.equal(resLoginWithBypass.status, 200, `Dengan bypass cookie, /login harus 200, didapat: ${resLoginWithBypass.status}`);
    const textLogin = await resLoginWithBypass.text();
    assert.ok(
      textLogin.includes('Portal Admin BEM') || textLogin.includes('login') || textLogin.includes('Google'),
      'Halaman login admin harus dapat diakses di /login dengan cookie bypass'
    );
    console.log('[PASS] 2.2 Dengan cookie bypass Konami, /login berhasil diakses (HTTP 200 - Perilaku Lama)');

    // 2.3 Saat flag non-aktif, pola token 75 karakter diperlakukan sebagai path asing biasa (tidak membuka login admin)
    const anyToken75 = 'A'.repeat(75);
    const resTokenWhenOff = await fetch(`${baseUrlInactive}/${anyToken75}`, { redirect: 'manual' });
    assert.notEqual(resTokenWhenOff.status, 200, 'Saat flag non-aktif, URL token 75 karakter tidak boleh return 200 login');
    console.log(`[PASS] 2.3 Saat flag non-aktif, pola token 75 karakter diperlakukan sebagai path asing biasa (status: ${resTokenWhenOff.status})`);

  } finally {
    killProcess(procInactive);
    console.log(`[Skenario 2] Server pada port ${PORT_INACTIVE} dihentikan.`);
  }

  console.log('\n>>> SEMUA TES INTEGRASI SERVER BERHASIL LOLOS (ALL PASSED) <<<');
}

runTests().catch((err) => {
  console.error('\n[GAGAL] Terjadi kesalahan pada test integrasi:', err);
  process.exit(1);
});
