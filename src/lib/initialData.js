export const INITIAL_BRANCHES = [
  {
    id: 'branch-1',
    name: 'MBG Mertoyudan Central',
    pic_name: 'Pak Slamet',
    phone_wa: '081234567890',
    daily_deposit: 3000000,
    is_active: true,
    address: 'Mertoyudan, Magelang'
  },
  {
    id: 'branch-2',
    name: 'MBG Borobudur Raya',
    pic_name: 'Ibu Ratna',
    phone_wa: '081398765432',
    daily_deposit: 2500000,
    is_active: true,
    address: 'Borobudur, Magelang'
  },
  {
    id: 'branch-3',
    name: 'MBG Muntilan Makmur',
    pic_name: 'Bpk. Hendro',
    phone_wa: '085712345678',
    daily_deposit: 2000000,
    is_active: true,
    address: 'Muntilan, Magelang'
  },
  {
    id: 'branch-4',
    name: 'MBG Magelang Tengah',
    pic_name: 'Ibu Dewi',
    phone_wa: '082133445566',
    daily_deposit: 3500000,
    is_active: true,
    address: 'Kota Magelang'
  },
  {
    id: 'branch-5',
    name: 'MBG Secang Harmoni',
    pic_name: 'Bpk. Agus',
    phone_wa: '081567890123',
    daily_deposit: 2000000,
    is_active: true,
    address: 'Secang, Magelang'
  },
  {
    id: 'branch-6',
    name: 'MBG Mungkid Sejahtera',
    pic_name: 'Ibu Lestari',
    phone_wa: '087890123456',
    daily_deposit: 2200000,
    is_active: true,
    address: 'Mungkid, Magelang'
  }
];

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const SHORT_DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function generatePeriodsForMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const periods = [
    {
      period_index: 1,
      title: 'Periode 1 (Tgl 1 - 14)',
      shortTitle: 'Tgl 1 - 14',
      start_day: 1,
      end_day: 14,
      total_calendar_days: 14
    },
    {
      period_index: 2,
      title: 'Periode 2 (Tgl 15 - 28)',
      shortTitle: 'Tgl 15 - 28',
      start_day: 15,
      end_day: 28,
      total_calendar_days: 14
    }
  ];

  if (daysInMonth > 28) {
    periods.push({
      period_index: 3,
      title: `Periode 3 (Tgl 29 - ${daysInMonth})`,
      shortTitle: `Tgl 29 - ${daysInMonth}`,
      start_day: 29,
      end_day: daysInMonth,
      total_calendar_days: daysInMonth - 28
    });
  }

  return periods;
}

// Generator sekuens bulan berurutan otomatis (Mulai Oktober 2026 sebagai Periode 1 -> Januari 2027 otomatis)
export function generateMonthSequence(startYear = 2026, startMonth = 10, count = 18) {
  const sequence = [];
  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < count; i++) {
    sequence.push({
      year: y,
      month: m,
      monthName: MONTH_NAMES[m - 1],
      label: `${MONTH_NAMES[m - 1]} ${y}`,
      shortLabel: `${MONTH_NAMES[m - 1]} ${y}`
    });

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return sequence;
}

