-- ==============================================================================
-- SISTEM REKAPAN PEMBAYARAN MBG (MAKAN BERGIZI GRATIS) - WILAYAH MAGELANG
-- DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. Tabel Cabang MBG (Branches)
CREATE TABLE IF NOT EXISTS public.mbg_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pic_name VARCHAR(255),
    phone_wa VARCHAR(50) NOT NULL,
    daily_deposit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Periode Rekap (Recap Periods - Tiap 14 Hari & Sheet Bulanan)
CREATE TABLE IF NOT EXISTS public.recap_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL,
    month INT NOT NULL, -- 1-12
    period_index INT NOT NULL, -- 1: Tgl 1-14, 2: Tgl 15-28, 3: Sisa Hari
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_calendar_days INT NOT NULL DEFAULT 14,
    active_days INT NOT NULL DEFAULT 12,
    weekly_holidays INT[] DEFAULT ARRAY[0], -- Default: 0 = Hari Minggu libur rutin
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Hari Libur Spesifik (Period Holidays)
CREATE TABLE IF NOT EXISTS public.period_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES public.recap_periods(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Transaksi Pembayaran Cabang (Payment Records)
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.mbg_branches(id) ON DELETE CASCADE NOT NULL,
    period_id UUID REFERENCES public.recap_periods(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100) DEFAULT 'Transfer Bank',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for high-performance query
CREATE INDEX IF NOT EXISTS idx_payment_branch_period ON public.payment_records(branch_id, period_id);
CREATE INDEX IF NOT EXISTS idx_recap_periods_year_month ON public.recap_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_period_holidays_period ON public.period_holidays(period_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mbg_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous access for read/write (Bisa disesuaikan dengan Auth Supabase)
CREATE POLICY "Public full access to mbg_branches" ON public.mbg_branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to recap_periods" ON public.recap_periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to period_holidays" ON public.period_holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to payment_records" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED DATA AWAL (CABANG MBG MAGELANG CONTOH DENGAN SETORAN BERAGAM)
-- ==============================================================================
INSERT INTO public.mbg_branches (name, pic_name, phone_wa, daily_deposit, address)
VALUES
  ('MBG Mertoyudan Central', 'Pak Slamet', '6281234567890', 3000000, 'Jl. Mayjen Bambang Soegeng, Mertoyudan, Magelang'),
  ('MBG Borobudur Raya', 'Ibu Ratna', '6281398765432', 2500000, 'Jl. Balaputradewa, Borobudur, Magelang'),
  ('MBG Muntilan Makmur', 'Bpk. Hendro', '6285712345678', 2000000, 'Jl. Pemuda No. 45, Muntilan, Magelang'),
  ('MBG Magelang Tengah', 'Ibu Dewi', '6282133445566', 3500000, 'Jl. Tidar, Magelang Tengah, Kota Magelang'),
  ('MBG Secang Harmoni', 'Bpk. Agus', '6281567890123', 2000000, 'Jl. Raya Secang - Temanggung Km 2, Secang'),
  ('MBG Mungkid Sejahtera', 'Ibu Lestari', '6287890123456', 2200000, 'Jl. Soekarno Hatta, Mungkid, Magelang')
ON CONFLICT DO NOTHING;
