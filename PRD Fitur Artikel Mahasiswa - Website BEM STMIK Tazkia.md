# PRD: Fitur Artikel Mahasiswa dengan Moderasi Admin

**Proyek:** Website Utama BEM & Portal Inovasi Mahasiswa STMIK Tazkia (bem.stmik.tazkia.ac.id) **Jenis perubahan:** Penambahan fitur pada web yang sudah live **Catatan untuk AI agent:** Dokumen ini adalah sumber kebenaran. Kerjakan bertahap sesuai urutan di bagian "Rencana Implementasi". Jika ada yang ambigu, tanyakan dulu daripada berasumsi.

## 1. Ringkasan

Saat ini web hanya digunakan oleh satu pengguna (admin) yang mengelola konten. Fitur ini membuat web menjadi multi-pengguna: mahasiswa dapat login dengan akun Google kampus, menulis dan mengunggah artikel, lalu artikel tersebut **wajib disetujui admin** sebelum tampil di web publik.

## 2. Tujuan dan Non-Tujuan

**Tujuan**

- Mahasiswa dapat menerbitkan tulisan melalui web BEM tanpa harus lewat admin untuk setiap pengetikan.
- Admin tetap mengontrol apa yang tayang (moderasi sebelum publikasi).
- Login mahasiswa tanpa proses pendaftaran manual.

**Non-tujuan (di luar cakupan versi ini)**

- Komentar, like, atau follow antar mahasiswa.
- Monetisasi atau statistik lanjutan.
- Login selain Google akun kampus.
- Pengiriman notifikasi lewat email (ditunda ke versi berikutnya).

## 3. Aktor dan Hak Akses

| Aktor | Hak akses |
| --- | --- |
| Publik (tanpa login) | Membaca artikel berstatus `published`. |
| Mahasiswa (login Google kampus) | Membuat, mengedit, menghapus, dan mengajukan artikel **miliknya sendiri**. Melihat status dan catatan review artikelnya. |
| Admin | Semua hak mahasiswa, ditambah mereview (setujui/tolak), mem-publish, meng-unpublish, dan menghapus artikel siapa pun. |

## 4. Alur Status Artikel

```
draft -> pending -> published
                \-> rejected -> (revisi) -> pending
```

- `draft`: masih ditulis, hanya terlihat oleh penulis.
- `pending`: sudah diajukan, menunggu review. **Terkunci**, penulis tidak bisa mengedit.
- `published`: tampil di publik.
- `rejected`: ditolak dengan catatan alasan dari admin. Penulis dapat merevisi dan mengajukan ulang.
- Jika artikel `published` diedit oleh penulis, perubahannya disimpan sebagai revisi berstatus `pending` untuk direview. Versi yang sudah tayang tetap tampil di publik selama revisi direview. Jika revisi disetujui, isinya menggantikan versi tayang; jika ditolak, artikel tetap memakai versi sebelumnya yang sudah tayang. (Keputusan pemilik proyek; detail di bagian 6.1.)
- Hanya admin yang dapat mengubah status menjadi `published`.

## 5. Kebutuhan Fungsional

### 5.1 Autentikasi

- **FR-A1** Mahasiswa login dengan Google OAuth.
- **FR-A2** Server memverifikasi email berakhiran domain kampus (`@student.stmik.tazkia.ac.id`, **satu-satunya domain yang diizinkan untuk akun mahasiswa**). Parameter `hd` di sisi client hanya petunjuk tampilan dan tidak boleh dijadikan satu-satunya pengecekan. Pencocokan harus pada akhiran persis (huruf kecil) dan hanya untuk email yang sudah diverifikasi Google (email\_verified = true), bukan sekadar mengandung teks domain tersebut. Email non-kampus ditolak dan sesi dihapus.
- **FR-A3** Auto-provisioning: jika email belum punya profil, buat otomatis di tabel `profiles` dengan `role = 'mahasiswa'`. Jika sudah ada, langsung masuk. Tidak ada form pendaftaran.
- **FR-A4** Role tidak boleh dapat ditentukan atau diubah dari client. Akun baru selalu `mahasiswa`. Admin diangkat manual lewat database atau whitelist email di server.
- **FR-A5** Login admin sudah ada di web dan dipakai apa adanya; jangan dibangun ulang atau diubah. Acuan perilakunya, yang harus tetap berlaku:
  - Dibuka lewat kode Konami di halaman web.
  - Menuju path admin yang **tidak berpola `/admin`**; nilainya dibaca dari environment variable (`ADMIN_LOGIN_PATH`), tidak ditulis permanen di kode, sehingga mudah diganti jika bocor.
  - Hanya email dalam whitelist admin (env atau tabel) yang dapat masuk.
  - Path admin tidak boleh muncul di `robots.txt`, `sitemap.xml`, atau navigasi. Halaman admin memakai `noindex`.
  - Pengguna tanpa hak admin yang membuka path admin mendapat respons **404**.
  - **Penting:** Kerahasiaan path hanya lapisan tambahan. Keamanan utama ada pada pengecekan role di server dan RLS (lihat bagian 8).

### 5.2 Fitur Mahasiswa

- **FR-M1** Dashboard "Artikel Saya": daftar artikel milik sendiri beserta status, tanggal, dan catatan review jika ditolak.
- **FR-M2** Form tulis/edit artikel: judul, isi, gambar sampul (opsional), kategori (opsional); batasan tiap bidang ada di bagian 5.5.
- **FR-M3** Simpan sebagai draft dan tombol "Ajukan untuk Review" (mengubah status ke `pending`).
- **FR-M4** Edit hanya diizinkan saat status `draft` atau `rejected` (atau `published`, dengan hasil berupa revisi berstatus `pending`). Tidak dapat diedit saat `pending`.
- **FR-M5** Hapus artikel miliknya sendiri yang berstatus `draft` atau `rejected`.
- **FR-M6** Jika revisi artikel tayang ditolak, penulis dapat memperbaikinya lalu mengajukan ulang, atau membatalkan revisi. Artikel yang sudah tayang tidak terpengaruh.

### 5.3 Fitur Admin

- **FR-AD1** Antrean review: daftar artikel dan revisi `pending`, terurut dari yang paling lama diajukan.
- **FR-AD2** Halaman detail review dengan pratinjau tampilan seperti di publik.
- **FR-AD3** Aksi **Setujui** (status `published`, isi `published_at`) dan **Tolak** (status `rejected`, catatan alasan wajib diisi).
- **FR-AD4** Admin dapat meng-unpublish atau menghapus artikel yang sudah tayang.
- **FR-AD5** Admin dapat membuat artikel sendiri yang langsung `published`.
- **FR-AD6** Audit log: catat siapa, kapan, dan aksi apa untuk setiap perubahan status.
- **FR-AD7** Untuk revisi artikel yang sudah tayang, halaman review menampilkan perbandingan (diff) antara versi tayang dan revisi. Setujui: isi revisi menggantikan versi tayang dalam satu transaksi. Tolak: revisi ditandai `rejected` dengan catatan, versi tayang tidak berubah.

### 5.4 Halaman Publik

- **FR-P1** `/artikel`: daftar artikel `published`, terbaru di atas, dengan pagination.
- **FR-P2** `/artikel/[slug]`: halaman baca dengan judul, penulis, tanggal terbit, gambar sampul, dan isi.
- **FR-P3** Artikel yang bukan `published` mengembalikan 404 untuk publik.

### 5.5 Batasan Input Artikel

Nilai di bawah adalah default dan bisa diubah. Setiap batas dicek di tiga tempat: form (untuk pesan error yang ramah), server, dan database lewat `check` constraint. Hanya server dan database yang tidak bisa dilewati.

| Bidang | Aturan |
| --- | --- |
| Judul | Teks polos, 10 sampai 120 karakter setelah di-trim. Tidak boleh hanya spasi, angka, atau simbol. Tanpa HTML. Spasi ganda dirapikan. |
| Slug | Dibuat otomatis dari judul: huruf kecil, a-z, 0-9, dan tanda hubung, maksimal 80 karakter, unik (jika bentrok tambah akhiran angka). Tidak berubah setelah artikel pertama kali `published` agar link tetap valid. Kata cadangan (`baru`, `edit`, `admin`, `api`) ditolak. |
| Isi | 300 sampai 20.000 karakter (kira-kira 50 sampai 3.000 kata). Wajib lolos sanitasi (bagian 8). Tanpa script, iframe, atau atribut event. |
| Gambar sampul | Opsional. jpg/png/webp, maksimal 2 MB, lebar maksimal 2000 px (di-resize server). Tipe file diperiksa dari isi file, bukan ekstensi. SVG ditolak. |
| Gambar dalam isi | Hanya jika editor mendukung. Maksimal 5 per artikel, aturan sama dengan gambar sampul. |
| Kategori | Opsional. Satu pilihan dari daftar tetap yang dikelola admin. |
| Link dalam isi | Hanya `http://` atau `https://`. `javascript:` dan `data:` ditolak. Link keluar diberi `rel="noopener noreferrer nofollow"`. |
| Catatan penolakan (admin) | Wajib, 10 sampai 500 karakter. |
| Kuota per mahasiswa | Maksimal 3 artikel `pending` sekaligus, 10 `draft` aktif, dan 5 pengajuan per hari. |

Acuan constraint di database (draft boleh belum lengkap, tetapi batas maksimal selalu berlaku dan batas minimal berlaku mulai `pending`):

```sql
alter table articles
  add constraint title_max check (char_length(btrim(title)) <= 120),
  add constraint title_min check (status = 'draft' or char_length(btrim(title)) >= 10),
  add constraint content_max check (char_length(content) <= 20000),
  add constraint content_min check (status = 'draft' or char_length(content) >= 300),
  add constraint slug_fmt check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  add constraint note_len check (review_note is null or char_length(review_note) between 10 and 500);
```

### 5.6 Notifikasi Dalam Web (in-app)

Notifikasi hanya tampil di dalam web. Pengiriman ke email belum dibuat di versi ini.

- **FR-N1** Ikon lonceng di header untuk pengguna yang login, dengan penanda jumlah notifikasi yang belum dibaca. Daftar lengkap ada di `/notifikasi` (terbaru di atas, dengan pagination).
- **FR-N2** Notifikasi dibuat otomatis oleh server (trigger atau fungsi database) pada kejadian di tabel di bawah. Klien tidak pernah membuat notifikasi sendiri.
- **FR-N3** Mengklik notifikasi membuka halaman terkait (dashboard artikel milik penulis, atau halaman review untuk admin) dan menandainya terbaca. Tersedia tombol "Tandai semua dibaca".
- **FR-N4** Pembaruan memakai polling berkala (misalnya tiap 60 detik) atau Supabase Realtime. Tidak memakai push.
- **FR-N5** Teks notifikasi hanya berisi jenis kejadian dan judul artikel (dipotong 80 karakter), di-escape saat ditampilkan. Notifikasi yang lebih lama dari 90 hari dihapus otomatis.

| Kejadian | Penerima | Pesan |
| --- | --- | --- |
| Mahasiswa mengajukan artikel atau revisi (`pending`) | Semua admin | Ada artikel menunggu review: judul |
| Artikel atau revisi disetujui | Penulis | Artikel judul disetujui dan tayang |
| Artikel atau revisi ditolak | Penulis | Artikel judul ditolak, lihat catatan admin |
| Admin meng-unpublish atau menghapus artikel | Penulis | Artikel judul diturunkan oleh admin |

## 6. Model Data (acuan, asumsi Supabase/PostgreSQL)

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'mahasiswa' check (role in ('mahasiswa','admin')),
  created_at timestamptz default now()
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  title text not null,
  slug text unique not null,
  content text not null,
  cover_url text,
  category text,
  status text not null default 'draft'
    check (status in ('draft','pending','published','rejected')),
  review_note text,
  reviewed_by uuid references profiles(id),
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table article_audit_log (
  id bigint generated always as identity primary key,
  article_id uuid references articles(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  note text,
  created_at timestamptz default now()
);
```

Trigger `on auth.users insert` membuat baris `profiles` otomatis dan menolak email di luar domain kampus.

### 6.1 Revisi Artikel yang Sudah Tayang

Artikel `published` tidak pernah diedit langsung. Perubahan dari penulis disimpan sebagai revisi di tabel terpisah, sehingga versi yang tayang tetap tampil selama revisi direview dan otomatis tetap dipakai jika revisi ditolak.

```sql
create table article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  author_id uuid not null references profiles(id),
  title text not null,
  content text not null,
  cover_url text,
  category text,
  status text not null default 'draft'
    check (status in ('draft','pending','rejected','approved')),
  review_note text,
  reviewed_by uuid references profiles(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- hanya satu revisi terbuka per artikel
create unique index one_open_revision
  on article_revisions(article_id)
  where status in ('draft','pending','rejected');
```

- Saat penulis mengedit artikel `published`, dibuat satu baris revisi (awalnya `draft`, berisi salinan artikel). Tombol "Ajukan perubahan" mengubahnya menjadi `pending`. `slug` dan `author_id` artikel tidak berubah.
- Revisi `pending` terkunci, sama seperti artikel `pending`.
- Setujui: dalam satu transaksi, salin `title`, `content`, `cover_url`, `category` dari revisi ke `articles`, perbarui `updated_at`, lalu tandai revisi `approved`.
- Tolak: revisi menjadi `rejected` dengan `review_note` (10 sampai 500 karakter). Tabel `articles` tidak disentuh, sehingga versi sebelumnya tetap tayang.
- Setelah ditolak, penulis boleh memperbaiki dan mengajukan ulang revisi yang sama, atau membatalkannya (baris revisi dihapus).
- Publik tidak pernah membaca `article_revisions`. Penggantian versi tayang hanya lewat fungsi database atau endpoint admin yang mengecek `role = 'admin'`.
- RLS: mahasiswa hanya dapat `select`, `insert`, dan `delete` revisi miliknya, dan `update` hanya saat revisi `draft` atau `rejected`. Mahasiswa tidak dapat mengubah `status` menjadi `approved`.
- Batasan input di bagian 5.5 berlaku juga untuk `article_revisions` (kecuali slug).

### 6.2 Notifikasi

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('submitted','approved','rejected','unpublished')),
  article_id uuid references articles(id) on delete cascade,
  message text not null check (char_length(message) <= 200),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index on notifications (recipient_id, read_at, created_at desc);
```

- Baris notifikasi hanya dibuat oleh trigger atau fungsi database (`security definer`) saat status artikel atau revisi berubah. Tidak ada `insert` dari klien.
- RLS: pengguna hanya dapat `select` notifikasi miliknya (`recipient_id = auth.uid()`) dan `update` kolom `read_at` miliknya saja. Tidak ada `delete` dari klien; pembersihan 90 hari dilakukan job terjadwal di server.

## 7. Rute

| Rute | Akses |
| --- | --- |
| `/artikel`, `/artikel/[slug]` | Publik |
| `/login` | Publik (login Google mahasiswa) |
| `/dashboard/artikel`, `/dashboard/artikel/baru`, `/dashboard/artikel/[id]/edit` | Mahasiswa (login) |
| `ADMIN_LOGIN_PATH` | Login admin (sudah ada; tersembunyi, 404 bagi yang tidak berhak) |
| Panel admin (path dari env) | Admin saja |

## 8. Keamanan (wajib)

1. **Otorisasi di server/database, bukan di UI.** Aktifkan RLS pada `articles`:
   - Publik: `select` hanya jika `status = 'published'`.
   - Mahasiswa: `select`/`insert`/`update`/`delete` hanya baris dengan `author_id = auth.uid()`, dan `update` hanya jika status saat ini `draft` atau `rejected`.
   - Hanya admin yang boleh mengubah `status` menjadi `published`, mengisi `review_note`/`reviewed_by`, atau memodifikasi artikel milik orang lain.
   - Mahasiswa tidak boleh mengubah kolom `status` ke `published` atau mengubah `author_id` melalui update langsung.
2. **Validasi role pada setiap API/route admin** di server, tidak hanya menyembunyikan tombol.
3. **Sanitasi konten** artikel sebelum ditampilkan (cegah XSS). Jika memakai markdown atau rich text, gunakan sanitizer (misalnya DOMPurify atau pipeline rehype-sanitize).
4. **Upload gambar:** hanya jpg/png/webp, maksimal 2 MB, nama file di-generate ulang, simpan di storage dengan path per pengguna.
5. **Rate limiting** pada endpoint login dan pengajuan artikel.
6. **Sesi admin pendek** (1 sampai 2 jam) dan disarankan MFA/2-Step Verification pada akun admin.
7. Jangan menyimpan secret, whitelist admin, atau `ADMIN_LOGIN_PATH` di kode atau repositori; gunakan environment variable.

### 8.1 Ancaman yang Harus Ditangani

| Ancaman | Mitigasi |
| --- | --- |
| XSS lewat judul atau isi | Sanitasi di server saat simpan dan saat render. Render markdown tanpa HTML mentah, judul selalu di-escape. CSP ketat (pakai nonce untuk script bawaan Next.js). |
| Mengakses artikel orang lain (IDOR) | RLS dengan `author_id = auth.uid()`. `author_id` diisi dari sesi, tidak pernah dari body request. Uji dengan dua akun mahasiswa. |
| Menaikkan hak akses (mass assignment) | Server hanya menerima field whitelist (`title`, `content`, `cover_url`, `category`). `status`, `author_id`, `role`, `reviewed_by`, `published_at` tidak pernah diambil dari input. Perubahan status lewat fungsi atau endpoint khusus yang mengecek role. |
| Isi diubah setelah disetujui | `pending` terkunci. Edit artikel `published` tidak pernah menimpa versi tayang; perubahan masuk sebagai revisi `pending` yang baru menggantikan versi tayang setelah disetujui admin. Aturan ini ditegakkan oleh RLS dan fungsi database, bukan oleh UI. |
| Upload berbahaya | Validasi tipe dari isi file, re-encode gambar di server (membuang EXIF dan muatan tersembunyi), nama file acak, bucket khusus, batas ukuran. |
| Spam dan banjir pengajuan | Kuota di bagian 5.5, rate limit per akun dan per IP, admin dapat menonaktifkan akun yang menyalahgunakan. |
| Akun di luar kampus | Cek domain di server, `email_verified = true`, cocokkan akhiran persis (FR-A2). |
| CSRF dan pembajakan sesi | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Aksi yang mengubah data lewat POST dengan proteksi CSRF. Sesi dicabut saat logout. |
| Konten tidak pantas lolos | Semua artikel melewati review admin, admin bisa unpublish, audit log mencatat semua aksi. |
| Kebocoran data pribadi | Publik hanya melihat nama dan avatar penulis lewat view khusus, tidak pernah email. Secret hanya di environment variable. |
| Mengintip draft lewat tebakan URL | Artikel yang tidak boleh dilihat mengembalikan 404, bukan 403. |

## 9. Kebutuhan Non-Fungsional

- Responsif (mobile dan desktop).
- Halaman publik cepat dimuat (SSR/ISR bila memungkinkan) dan ramah SEO (meta title/description, `slug` yang bersih).
- Pesan error dan label UI dalam Bahasa Indonesia.
- Konsisten dengan desain dan komponen web BEM yang sudah ada (Tailwind).

## 10. Kriteria Penerimaan

- [ ] Akun Google non-kampus ditolak saat login.
- [ ] Login pertama mahasiswa otomatis membuat profil `mahasiswa`; login berikutnya tidak membuat duplikat.
- [ ] Mahasiswa tidak dapat melihat atau mengedit artikel milik orang lain, meski memanggil API langsung.
- [ ] Mahasiswa tidak dapat membuat artikelnya berstatus `published` dengan cara apa pun.
- [ ] Artikel `pending` tidak dapat diedit penulis dan tidak tampil di publik.
- [ ] Admin dapat menyetujui artikel dan artikel langsung tampil di `/artikel`.
- [ ] Penolakan wajib menyertakan catatan, dan catatan terlihat oleh penulis.
- [ ] Path admin tidak muncul di sitemap/robots dan mengembalikan 404 untuk non-admin.
- [ ] Akses langsung ke API admin oleh non-admin ditolak (401/403).
- [ ] Konten berisi `<script>` tidak tereksekusi saat ditampilkan.

* [ ] Email berakhiran lain ditolak, termasuk yang menyerupai seperti `nama@student.stmik.tazkia.ac.id.contoh.com`.
* [ ] Judul kurang dari 10 atau lebih dari 120 karakter, serta isi kurang dari 300 atau lebih dari 20.000 karakter, ditolak oleh server dan database, bukan hanya form.
* [ ] File dengan ekstensi gambar tetapi isinya bukan gambar, file SVG, dan gambar di atas 2 MB ditolak.
* [ ] Request yang mengirim `status`, `author_id`, atau `role` di body diabaikan atau ditolak.
* [ ] Pengajuan `pending` keempat dan pengajuan keenam dalam sehari ditolak.
* [ ] Mengedit artikel `published` lewat API langsung hanya membuat revisi `pending`.
* [ ] Mahasiswa A tidak dapat membaca draft mahasiswa B (hasilnya 404).
* [ ] Respons memuat header CSP dan cookie sesi bertanda `HttpOnly` dan `Secure`.

- [ ] Selama revisi `pending`, `/artikel/[slug]` tetap menampilkan versi lama.
- [ ] Revisi yang disetujui menggantikan versi tayang; revisi yang ditolak membuat artikel tetap memakai versi tayang sebelumnya.
- [ ] Satu artikel hanya dapat memiliki satu revisi terbuka pada satu waktu.

* [ ] Admin menerima notifikasi saat ada artikel atau revisi baru berstatus `pending`.
* [ ] Penulis menerima notifikasi saat artikelnya disetujui, ditolak, atau diturunkan.
* [ ] Pengguna tidak dapat membuat notifikasi lewat API langsung dan tidak dapat membaca notifikasi milik orang lain.
* [ ] Tidak ada email yang dikirim oleh fitur ini.

## 11. Rencana Implementasi (urutan kerja untuk agent)

1. Skema database, tabel revisi (6.1), check constraint batasan input (5.5), trigger auto-provisioning, dan pengecekan domain.
2. RLS untuk `profiles`, `articles`, dan `article_audit_log`.
3. Login Google mahasiswa dan middleware proteksi rute.
4. Dashboard mahasiswa: CRUD draft, ajukan, lihat status, edit artikel tayang sebagai revisi.
5. Notifikasi dalam web: tabel `notifications`, trigger, ikon lonceng, dan halaman `/notifikasi`.
6. Halaman publik `/artikel` dan `/artikel/[slug]`.
7. Panel review admin (termasuk diff revisi), memakai login admin yang sudah ada (login tidak diubah).
8. Audit log, validasi batasan input (5.5), upload gambar, sanitasi konten, rate limiting, CSP.
9. Pengujian sesuai kriteria penerimaan, termasuk percobaan akses ilegal.

## 12. Asumsi dan Pertanyaan Terbuka

- **Asumsi:** backend memakai Supabase dan frontend Next.js + Tailwind. Jika memakai Firebase, ganti RLS dengan Security Rules dan trigger dengan Cloud Function.
- Domain email mahasiswa: `@student.stmik.tazkia.ac.id`.
- Akun admin: `sudah ada di sistem, tidak perlu diisi`.
- Format isi artikel: rich text editor atau markdown? `<PILIH>`.
- Notifikasi dalam web (bagian 5.6) dibuat di versi ini. Pengiriman notifikasi ke email belum diminta karena domain email dipegang pihak lain. Status email: `ditunda ke versi berikutnya`.
- Artikel `published` yang diedit disimpan sebagai revisi `pending` (versi tayang tetap tampil selama review; jika ditolak tetap memakai versi sebelumnya). Sudah diputuskan.
