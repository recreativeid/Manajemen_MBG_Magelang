# PROJECT MASTER DOCUMENTATION: SISTEM REKAPAN PEMBAYARAN MBG MAGELANG
> **Dokumen Single Source of Truth (SSOT)**: File ini merangkum seluruh arsitektur, struktur direktori, kode file, logika bisnis, dan skema database agar AI dapat memahami seluruh proyek dalam satu kali bacaan super hemat token di sesi selanjutnya.

---

## 1. Ringkasan Proyek & Tujuan Bisnis

Aplikasi web modern berbasis **Node.js (Vite + React)** dan **Supabase (PostgreSQL)** dengan estetika **Minimalist SaaS** (Background putih bersih dengan selingan warna biru segar, icon vektor monokrom). Sistem ini mengelola pencatatan harian, rekapan 1 bulan penuh, serta penagihan program **Makan Bergizi Gratis (MBG)** di wilayah Kabupaten & Kota Magelang.

### Aturan Bisnis Inti (Business Rules):
1. **Rekapan 1 Bulan Penuh (Daily Matrix Table)**:
   - Menampilkan hari demi hari (tanggal 1 s/d 30/31) dalam satu tampilan matrix spreadsheet horizontal yang responsif.
   - Admin dapat mengetahui dengan jelas **apakah setiap cabang sudah menyetor atau belum pada setiap tanggal tertentu**, bukan sekadar angka akumulasi global.
2. **Siklus Berjalan Berkesinambungan 14 Hari (Continuous Rolling 14-Day Cycle)**:
   - Hari dikelompokkan dalam blok 14 hari berkesinambungan yang tidak dipotong paksa di akhir bulan:
     - **Siklus 1**: 01 Okt 2026 - 14 Okt 2026
     - **Siklus 2**: 15 Okt 2026 - 28 Okt 2026
     - **Siklus 3**: 29 Okt 2026 - 11 Nov 2026 (Sisa 3 hari di Oktober langsung bersambung dengan 11 hari di November!).
     - **Siklus 4**: 12 Nov 2026 - 25 Nov 2026, dst.
   - Header kolom tabel memiliki penanda siklus 14 hari yang jelas.
3. **Input Setoran Harian yang Super Simpel & Cepat (1-Klik)**:
   - Admin cukup **mengklik 1 kali** pada kotak tanggal cabang untuk langsung menandai setor penuh sesuai tarif setoran tetap harian cabang tersebut (`daily_deposit`).
   - Kotak tanggal yang sudah setor akan terisi warna biru segar dengan tanda centang `✓`.
   - Kotak tanggal hari kerja yang belum setor bertanda `-` (putih/merah muda).
   - Klik kembali pada kotak tanggal untuk membuka modal edit nominal kustom atau menghapus setoran.
   - Tombol **+Semua**: Dapat menandai seluruh hari kerja aktif bulan ini langsung lunas dalam 1 klik.
4. **Kalender Hari Libur (Klik Tanggal Merah = Libur)**:
   - Kalender bulan asli 7 kolom (Min s/d Sab).
   - Klik tanggal langsung berubah menjadi **Merah (Libur)**.
   - Hari libur otomatis berstatus bebas setoran (di tabel matrix harian sel otomatis berlabel `Libur` dan tidak dihitung dalam total tagihan kewajiban).
5. **WhatsApp Penagihan Rinci**:
   - Tombol **Tagih WA** di sisi kanan tabel secara cerdas merinci **tanggal-tanggal berapa saja yang belum disetor** oleh cabang terkait (contoh: *Tanggal belum setor: Tgl 5, 8, 12, 19, 23*).

---

## 2. Struktur Direktori Lengkap

```
c:\xampp\htdocs\Sistem_Rekapan_MBG_Magelang/
├── PROJECT_MASTER_DOC.md       # Dokumen master acuan proyek (Hemat token AI)
├── supabase_schema.sql         # Skrip DDL PostgreSQL Supabase lengkap (Tabel, RLS, Seed)
├── package.json                # Konfigurasi dependensi Node.js, React, Vite, Tailwind, Recharts
├── vite.config.js              # Pengaturan Vite bundler dengan port 5173
├── tailwind.config.js          # Konfigurasi palette SaaS (White & Fresh Blue)
├── postcss.config.js           # Pengaturan PostCSS untuk Tailwind & Autoprefixer
├── index.html                  # File HTML utama dengan font Plus Jakarta Sans
├── .env                        # Konfigurasi variabel lingkungan (Supabase URL & Anon Key)
├── .env.example                # Template variabel lingkungan
└── src/
    ├── main.jsx                # Entry point React DOM
    ├── App.jsx                 # State controller utama, tab switcher, modal handler
    ├── lib/
    │   ├── authService.js      # Autentikasi admin, sesi login, verifikasi & ganti sandi
    │   ├── supabase.js         # Supabase client & deteksi konfigurasi aktif
    │   ├── initialData.js      # Data awal cabang MBG, sekuens bulan otomatis 2026->2027
    │   ├── storageService.js   # Dual-Engine Service: Continuous 14-day rolling cycle & matrix harian
    │   └── waHelper.js         # Generator WhatsApp dengan rincian tanggal belum setor
    ├── components/
    │   ├── LoginPage.jsx       # Layar login admin resmi dengan logo BGN & sandi default admin123
    │   ├── ChangePasswordModal.jsx # Modal pengaturan ganti kata sandi admin
    │   ├── Navbar.jsx          # Header navigasi: Logo resmi BGN, menu admin & ganti sandi
    │   ├── StatCard.jsx        # Komponen kartu metrik KPI minimalis
    │   ├── BranchModal.jsx     # Modal edit & tambah cabang MBG (Nama, Setoran Tetap, WA)
    │   ├── DailyPaymentModal.jsx # Modal cepat edit nominal & riwayat setoran harian per tanggal
    │   ├── PaymentModal.jsx    # Modal input setoran pembayaran periode
    │   └── HolidayManager.jsx  # Kalender interaktif (klik tanggal merah = libur)
    └── pages/
        ├── DashboardPage.jsx   # DASHBOARD: Grafik batang komparasi & rasio pelunasan
        └── RecapPage.jsx       # KELOLA REKAP: Matrix harian 1 bulan full, continuous 14-day cycle, input 1-klik
```

---

## 3. Rincian Komponen & Alur Kerja Data

### `src/lib/storageService.js`
- `getContinuousCycleInfo(dateObj)`: Mengkalkulasi siklus 14 hari berkesinambungan melintasi pergantian bulan dan tahun secara matematis tanpa terpotong.
- `getFullMonthMatrixData(year, month)`: Membangun struktur matrix tanggal 1 s/d akhir bulan untuk semua cabang dengan pemetaan hari libur, pengelompokan siklus 14 hari, serta status setoran per tanggal.
- `toggleDailyPayment({ branchId, dateStr, defaultAmount })`: Fungsi 1-klik untuk toggle status setor hari kerja.
- `quickFillWorkingDaysForBranch(branchId, dates, dailyDeposit)`: Mengisi lunas seluruh hari kerja aktif bulan ini dalam 1 klik.

### `src/pages/RecapPage.jsx` (`Kelola Rekap Pembayaran`)
- Menampilkan matrix 1 bulan penuh secara horizontal.
- Header baris 1: Header siklus 14 hari (misal `Siklus 14-Hari #3 (29 Okt - 11 Nov)`).
- Header baris 2: Tanggal 1..31 + nama hari.
- Kolom kiri sticky: Nama Cabang & Nominal Setoran Tetap / Hari.
- Sel tanggal interaktif: Klik untuk toggle bayar / buka edit.
- Kolom kanan sticky: Total Terbayar, Total Tagihan, Sisa Kurang Bayar, Hari Terisi, dan Tombol Tagih WA.

---

## 4. Panduan Menjalankan

1. **Jalankan Server**:
   ```bash
   npm.cmd run dev
   ```
   Aplikasi aktif di `http://localhost:5173/`.
2. **Koneksi Supabase (Opsional)**:
   - Masukkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada file `.env`.
   - Jalankan `supabase_schema.sql` di Supabase SQL Editor.
