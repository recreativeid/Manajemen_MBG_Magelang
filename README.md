# Sistem Rekapan Pembayaran MBG (Makan Bergizi Gratis) - Magelang
### Badan Gizi Nasional Republik Indonesia

Aplikasi web modern berbasis **Node.js (Vite + React)** dan **Supabase (PostgreSQL)** dengan desain **Minimalist SaaS** untuk mengelola pencatatan harian, rekapan 1 bulan penuh, serta penagihan setoran program Makan Bergizi Gratis (MBG) di wilayah Kabupaten & Kota Magelang.

---

## 🌟 Fitur Utama

1. **Rekapan 1 Bulan Penuh (Daily Matrix Table)**:
   - Menampilkan tanggal 1 s/d 30/31 secara horizontal lengkap dengan nama hari.
   - Melacak status setiap cabang di hari apa saja yang sudah mengisi dan yang belum.
2. **Siklus 14 Hari Berkelanjutan (Continuous Rolling 14-Day Cycle)**:
   - Dikelompokkan rapi per 14 hari melintasi akhir bulan tanpa terpotong (misal 29 Okt - 11 Nov bersambung langsung).
   - Terdapat pemilih rentang hari yang bersih tanpa tagar (`#`).
3. **Input Harian 1-Klik**:
   - Cukup klik kotak tanggal cabang untuk langsung menandai setor penuh sesuai tarif harian tetap cabang tersebut (`daily_deposit`).
   - Tersedia tombol `+Semua` untuk mengisi lunas seluruh hari kerja aktif bulan ini dalam 1 klik.
4. **Kalender Hari Libur Interaktif**:
   - Kalender bulan asli (Minggu s/d Sabtu). Klik tanggal langsung berubah menjadi **Merah (Libur)**.
   - Hari libur otomatis memotong hari kerja aktif dan tidak dihitung dalam kewajiban setoran cabang.
5. **WhatsApp Penagihan Rinci**:
   - Tombol **Tagih WA** otomatis menyusun pesan penagihan resmi yang merinci tanggal-tanggal berapa saja yang belum disetor oleh cabang.
6. **Dashboard Monitoring & Grafik**:
   - Menampilkan grafik batang komparasi nominal **Sudah Bayar vs Kurang Bayar** per cabang, pie chart rasio pelunasan, dan kartu ringkasan KPI.
7. **Dual-Engine Data Layer**:
   - Siap terhubung ke Supabase Cloud (skema SQL lengkap di `supabase_schema.sql`).
   - Fallback otomatis ke Reactive Local Storage saat offline.

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v18+ atau v24+
- NPM

### Instalasi & Menjalankan Server
```bash
# 1. Clone repository
git clone <URL_REPOSITORY_ANDA>
cd Sistem_Rekapan_MBG_Magelang

# 2. Install dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka browser di: `http://localhost:5173/`

---

## 🗄️ Konfigurasi Supabase (Opsional)

1. Buat project baru di [Supabase](https://supabase.com).
2. Salin dan jalankan seluruh query di file `supabase_schema.sql` pada SQL Editor Supabase.
3. Buat file `.env` di direktori utama:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh...
   ```
4. Restart server `npm run dev`.

---

## 📄 Dokumentasi Arsitektur
Lihat file [`PROJECT_MASTER_DOC.md`](./PROJECT_MASTER_DOC.md) untuk dokumentasi lengkap arsitektur sistem, peta file, dan rumus bisnis.
