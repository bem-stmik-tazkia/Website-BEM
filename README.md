# BEM STMIK Tazkia — Portal Resmi & Inovasi Mahasiswa

Ini adalah *source code* untuk website resmi **Badan Eksekutif Mahasiswa (BEM) STMIK Tazkia**. Website ini berfungsi sebagai pusat informasi publik (agenda, berita, volunteer, dokumentasi kegiatan) dan memiliki sistem admin internal untuk manajemen konten.

## 🌟 Fitur Utama

- **Multi-Bahasa (i18n):** Mendukung 5 bahasa (Indonesia, English, Français, العربية, 日本語) dengan deteksi bahasa otomatis.
- **Admin Dashboard Terproteksi:** Sistem login khusus untuk pengurus BEM terintegrasi dengan **Supabase Auth**.
- **Manajemen Konten:** Admin dapat mengatur dan mempublikasikan Agenda, Berita, Volunteer, Dokumentasi, Kabinet, dan melihat Saran/Aduan dari mahasiswa.
- **Tour Guide Otomatis:** Fitur _onboarding_ / panduan interaktif menggunakan `driver.js` untuk pengguna baru.
- **Performa & Animasi:** Dibangun menggunakan Next.js App Router dengan animasi transisi yang mulus dari `framer-motion` dan animasi Lottie.
- **Keamanan:** Rute internal dan API route dilindungi oleh Middleware Supabase + konfirmasi konami-style code untuk login admin.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Multi-language:** [next-intl](https://next-intl-docs.vercel.app/)
- **Animasi:** [Framer Motion](https://www.framer.com/motion/) & [DotLottie](https://lottiefiles.com/dotlottie)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/) & Google Material Symbols

---

## 🚀 Cara Menjalankan di Lokal (Local Development)

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- **Node.js** (versi 18.x atau terbaru)
- **npm** atau **yarn**

### 2. Instalasi Dependensi
Clone repository ini, lalu jalankan perintah instalasi:

```bash
npm install
# atau
yarn install
```

### 3. Pengaturan Environment Variables (Variabel Lingkungan)
Buat file bernama `.env.local` di folder *root* proyek (sejajar dengan `package.json`), dan isi dengan kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_SUPABASE_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```
*(Hubungi pengembang sebelumnya atau ketua departemen IT BEM untuk mendapatkan kunci ini)*

### 4. Menjalankan Development Server
Mulai jalankan proyek dengan perintah:

```bash
npm run dev
# atau
yarn dev
```

Buka `http://localhost:3000` di *browser* Anda. Website sudah siap digunakan!

---

## 📂 Struktur Direktori Penting

- `/messages` — Berisi file terjemahan `.json` untuk 5 bahasa (`id`, `en`, `fr`, `ar`, `ja`).
- `/src/app` — Folder App Router Next.js.
  - `/[locale]` — Halaman utama publik (Home, Berita, Agenda, Volunteer, dll).
  - `/(internal)` — Halaman terproteksi (Login & Admin Dashboard).
- `/src/components` — Komponen UI React yang dapat digunakan ulang (Navbar, Footer, Charts, dll).
- `/src/utils/supabase` — Konfigurasi _client_ dan _server_ untuk Supabase.
- `/src/middleware.ts` & `/src/proxy.ts` — Middleware untuk mendeteksi bahasa dan mengamankan rute admin.

## 🔐 Cara Akses Admin

Karena halaman admin tersembunyi untuk publik, Anda harus:
1. Mengetikkan URL `/login` di *browser*.
2. Memasukkan "kode rahasia" di _keyboard_ (opsional, disesuaikan dengan konfigurasi tim IT BEM) sebelum form login muncul.
3. Login menggunakan **Akun Google** yang telah diberikan akses `role: admin` di database Supabase (tabel `profiles`).

## 📜 Lisensi & Hak Cipta
Website ini dikembangkan secara internal untuk kepentingan BEM STMIK Tazkia. Hak cipta © BEM STMIK Tazkia.
