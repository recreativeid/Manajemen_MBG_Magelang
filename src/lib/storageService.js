import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_BRANCHES, generatePeriodsForMonth } from './initialData';

const STORAGE_KEYS = {
  BRANCHES: 'mbg_magelang_branches',
  PERIOD_CONFIGS: 'mbg_magelang_period_configs',
  PAYMENTS: 'mbg_magelang_daily_payments_v2'
};

// Anchor date untuk siklus berkesinambungan 14-hari (Continuous Rolling 14-Day Cycle)
// Dimulai 1 Oktober 2026:
// Siklus 1: 01 Okt 2026 - 14 Okt 2026
// Siklus 2: 15 Okt 2026 - 28 Okt 2026
// Siklus 3: 29 Okt 2026 - 11 Nov 2026 (Bersambung ke bulan berikutnya!)
// Siklus 4: 12 Nov 2026 - 25 Nov 2026, dst.
const ANCHOR_DATE = new Date(2026, 9, 1); // 1 Okt 2026 (month is 0-indexed: 9 = Oktober)

export function getContinuousCycleInfo(dateObj) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffTime = d.getTime() - ANCHOR_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const cycleIndex = Math.floor(diffDays / 14);
  const dayInCycle = ((diffDays % 14) + 14) % 14 + 1; // 1 s/d 14
  
  const cycleStart = new Date(ANCHOR_DATE.getTime() + cycleIndex * 14 * 24 * 60 * 60 * 1000);
  const cycleEnd = new Date(cycleStart.getTime() + 13 * 24 * 60 * 60 * 1000);

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatShort = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  return {
    cycleNumber: cycleIndex + 1,
    dayInCycle,
    cycleStartDate: formatDate(cycleStart),
    cycleEndDate: formatDate(cycleEnd),
    cycleLabel: `${formatShort(cycleStart)} - ${formatShort(cycleEnd)}`
  };
}

// Helper LocalStorage
function getLocalItem(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from LocalStorage`, e);
    return defaultValue;
  }
}

function setLocalItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to LocalStorage`, e);
  }
}

// Inisialisasi awal
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    setLocalItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERIOD_CONFIGS)) {
    setLocalItem(STORAGE_KEYS.PERIOD_CONFIGS, {});
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    // Generate initial sample daily payments for October 2026
    const samplePayments = [];
    const sampleDays = [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14]; // hari kerja
    INITIAL_BRANCHES.forEach(branch => {
      sampleDays.forEach(day => {
        // Simulasi: beberapa cabang sudah setor
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        samplePayments.push({
          id: `pay-${branch.id}-${dateStr}`,
          branchId: branch.id,
          date: dateStr,
          amount: branch.daily_deposit,
          paymentMethod: 'Transfer Bank',
          notes: 'Setoran harian'
        });
      });
    });
    setLocalItem(STORAGE_KEYS.PAYMENTS, samplePayments);
  }
}

initLocalStorage();

// ==========================================
// 1. CABANG (BRANCHES)
// ==========================================
export async function getBranches() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('mbg_branches')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(b => ({
          id: b.id,
          name: b.name,
          pic_name: b.pic_name,
          phone_wa: b.phone_wa,
          daily_deposit: Number(b.daily_deposit),
          is_active: b.is_active,
          address: b.address
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch branches fallback to local', err);
    }
  }
  return getLocalItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
}

export async function saveBranch(branch) {
  const localBranches = getLocalItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  let updated;
  if (branch.id) {
    updated = localBranches.map(b => b.id === branch.id ? { ...b, ...branch } : b);
  } else {
    const newBranch = {
      ...branch,
      id: 'branch-' + Date.now(),
      is_active: true
    };
    updated = [...localBranches, newBranch];
  }
  setLocalItem(STORAGE_KEYS.BRANCHES, updated);

  if (isSupabaseConfigured) {
    try {
      if (branch.id && !branch.id.startsWith('branch-')) {
        await supabase.from('mbg_branches').upsert({
          id: branch.id,
          name: branch.name,
          pic_name: branch.pic_name,
          phone_wa: branch.phone_wa,
          daily_deposit: branch.daily_deposit,
          is_active: branch.is_active,
          address: branch.address
        });
      } else {
        await supabase.from('mbg_branches').insert({
          name: branch.name,
          pic_name: branch.pic_name,
          phone_wa: branch.phone_wa,
          daily_deposit: branch.daily_deposit,
          is_active: true,
          address: branch.address
        });
      }
    } catch (e) {
      console.warn('Supabase saveBranch failed', e);
    }
  }

  return updated;
}

export async function deleteBranch(branchId) {
  const localBranches = getLocalItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  const filtered = localBranches.filter(b => b.id !== branchId);
  setLocalItem(STORAGE_KEYS.BRANCHES, filtered);

  if (isSupabaseConfigured && !branchId.startsWith('branch-')) {
    try {
      await supabase.from('mbg_branches').delete().eq('id', branchId);
    } catch (e) {
      console.warn('Supabase deleteBranch failed', e);
    }
  }
  return filtered;
}

// ==========================================
// 2. PENGATURAN HARI LIBUR
// ==========================================
export function getMonthConfigKey(year, month) {
  return `holidays_${year}_${month}`;
}

export async function getMonthHolidayConfig(year, month) {
  const key = getMonthConfigKey(year, month);
  const configs = getLocalItem(STORAGE_KEYS.PERIOD_CONFIGS, {});
  return configs[key] || {
    weeklyHolidays: [0], // Default: Hari Minggu (0) libur
    customHolidays: []   // Array tanggal YYYY-MM-DD
  };
}

export async function saveMonthHolidayConfig(year, month, newConfig) {
  const key = getMonthConfigKey(year, month);
  const configs = getLocalItem(STORAGE_KEYS.PERIOD_CONFIGS, {});
  configs[key] = newConfig;
  setLocalItem(STORAGE_KEYS.PERIOD_CONFIGS, configs);
  return newConfig;
}

// ==========================================
// 3. TRANSAKSI SETORAN HARIAN (DAILY PAYMENTS)
// ==========================================
export async function getAllPayments() {
  return getLocalItem(STORAGE_KEYS.PAYMENTS, []);
}

// 1-Klik Toggle Pembayaran Harian untuk Cabang & Tanggal tertentu
export async function toggleDailyPayment({ branchId, dateStr, defaultAmount }) {
  const allPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
  const existingIndex = allPayments.findIndex(p => p.branchId === branchId && p.date === dateStr);

  let updated;
  let statusResult;

  if (existingIndex >= 0) {
    // Sudah bayar -> toggle hapus setoran
    updated = allPayments.filter((_, idx) => idx !== existingIndex);
    statusResult = 'REMOVED';
  } else {
    // Belum bayar -> catat setoran penuh
    const newRecord = {
      id: `pay-${branchId}-${dateStr}-${Date.now()}`,
      branchId,
      date: dateStr,
      amount: Number(defaultAmount || 0),
      paymentMethod: 'Transfer Bank',
      notes: 'Setoran harian'
    };
    updated = [newRecord, ...allPayments];
    statusResult = 'PAID';
  }

  setLocalItem(STORAGE_KEYS.PAYMENTS, updated);
  return { updated, statusResult };
}

// Simpan / Edit nominal spesifik setoran harian
export async function saveDailyPaymentRecord({ branchId, dateStr, amount, paymentMethod, notes }) {
  const allPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
  const existingIndex = allPayments.findIndex(p => p.branchId === branchId && p.date === dateStr);

  const numAmount = Number(amount || 0);
  let updated;

  if (numAmount <= 0) {
    // Jika diisi 0, hapus record
    updated = allPayments.filter((_, idx) => idx !== existingIndex);
  } else if (existingIndex >= 0) {
    // Update record yang ada
    updated = allPayments.map((p, idx) => {
      if (idx === existingIndex) {
        return {
          ...p,
          amount: numAmount,
          paymentMethod: paymentMethod || p.paymentMethod || 'Transfer Bank',
          notes: notes !== undefined ? notes : p.notes
        };
      }
      return p;
    });
  } else {
    // Tambah record baru
    const newRecord = {
      id: `pay-${branchId}-${dateStr}-${Date.now()}`,
      branchId,
      date: dateStr,
      amount: numAmount,
      paymentMethod: paymentMethod || 'Transfer Bank',
      notes: notes || 'Setoran harian'
    };
    updated = [newRecord, ...allPayments];
  }

  setLocalItem(STORAGE_KEYS.PAYMENTS, updated);
  return updated;
}

// Quick Fill: Setor Semua Hari Kerja Aktif Bulan Ini untuk suatu Cabang
export async function quickFillWorkingDaysForBranch(branchId, dates, dailyDeposit) {
  const allPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
  let updated = [...allPayments];

  dates.forEach(dateStr => {
    const existingIndex = updated.findIndex(p => p.branchId === branchId && p.date === dateStr);
    if (existingIndex < 0) {
      updated.push({
        id: `pay-${branchId}-${dateStr}-${Date.now()}`,
        branchId,
        date: dateStr,
        amount: Number(dailyDeposit || 0),
        paymentMethod: 'Transfer Bank',
        notes: 'Setoran harian otomatis'
      });
    }
  });

  setLocalItem(STORAGE_KEYS.PAYMENTS, updated);
  return updated;
}

// ==========================================
// 4. MATRIX LENGKAP 1 BULAN & SIKLUS 14 HARI
// ==========================================
export async function getFullMonthMatrixData(year, month) {
  const branches = await getBranches();
  const holidayConfig = await getMonthHolidayConfig(year, month);
  const allPayments = await getAllPayments();

  const daysInMonth = new Date(year, month, 0).getDate();
  const activeBranches = branches.filter(b => b.is_active);

  const weeklyHolidays = holidayConfig.weeklyHolidays || [0];
  const customHolidays = holidayConfig.customHolidays || [];

  // Bangun struktur hari 1 s/d daysInMonth
  const daysList = [];
  const cyclesMap = {}; // Mengelompokkan kolom berdasarkan Siklus 14 Hari
  let totalMonthWorkingDays = 0;
  let totalMonthHolidays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isWeekly = weeklyHolidays.includes(dayOfWeek);
    const isCustom = customHolidays.includes(dateStr);
    const isHoliday = isWeekly || isCustom;

    if (isHoliday) {
      totalMonthHolidays++;
    } else {
      totalMonthWorkingDays++;
    }

    const cycleInfo = getContinuousCycleInfo(dateObj);

    // Grouping siklus
    if (!cyclesMap[cycleInfo.cycleNumber]) {
      cyclesMap[cycleInfo.cycleNumber] = {
        cycleNumber: cycleInfo.cycleNumber,
        label: cycleInfo.cycleLabel,
        cycleStartDate: cycleInfo.cycleStartDate,
        cycleEndDate: cycleInfo.cycleEndDate,
        days: []
      };
    }
    cyclesMap[cycleInfo.cycleNumber].days.push(day);

    daysList.push({
      dayNumber: day,
      dateStr,
      dayOfWeek,
      isHoliday,
      cycleInfo
    });
  }

  // Data per cabang
  const branchMatrix = activeBranches.map(branch => {
    let branchTotalPaid = 0;
    let branchWorkingDaysBilled = 0;
    let paidWorkingDaysCount = 0;
    const unpaidWorkingDates = [];

    const dailyEntries = daysList.map(d => {
      const payment = allPayments.find(p => p.branchId === branch.id && p.date === d.dateStr);
      const isPaid = Boolean(payment && payment.amount > 0);
      const amount = payment ? Number(payment.amount) : 0;

      if (!d.isHoliday) {
        branchWorkingDaysBilled++;
        if (isPaid) {
          paidWorkingDaysCount++;
        } else {
          unpaidWorkingDates.push(d.dayNumber);
        }
      }

      branchTotalPaid += amount;

      let status = 'UNPAID';
      if (d.isHoliday) {
        status = 'HOLIDAY';
      } else if (isPaid) {
        status = amount >= branch.daily_deposit ? 'PAID' : 'PARTIAL';
      }

      return {
        dayNumber: d.dayNumber,
        dateStr: d.dateStr,
        isHoliday: d.isHoliday,
        isPaid,
        amount,
        payment,
        status,
        cycleNumber: d.cycleInfo.cycleNumber
      };
    });

    const totalBilling = branch.daily_deposit * branchWorkingDaysBilled;
    const remainingAmount = Math.max(0, totalBilling - branchTotalPaid);
    const isLunas = branchTotalPaid >= totalBilling && totalBilling > 0;

    return {
      branch,
      dailyEntries,
      workingDaysCount: branchWorkingDaysBilled,
      paidWorkingDaysCount,
      unpaidWorkingDates,
      totalBilling,
      totalPaid: branchTotalPaid,
      remainingAmount,
      isLunas
    };
  });

  // KPI Bulan
  const totalBilledMonth = branchMatrix.reduce((sum, b) => sum + b.totalBilling, 0);
  const totalPaidMonth = branchMatrix.reduce((sum, b) => sum + b.totalPaid, 0);
  const totalRemainingMonth = branchMatrix.reduce((sum, b) => sum + b.remainingAmount, 0);
  const lunasCount = branchMatrix.filter(b => b.isLunas).length;
  const paymentPercentage = totalBilledMonth > 0 ? Math.round((totalPaidMonth / totalBilledMonth) * 100) : 0;

  return {
    year,
    month,
    daysInMonth,
    daysList,
    cyclesList: Object.values(cyclesMap),
    holidayConfig,
    stats: {
      totalDays: daysInMonth,
      workingDays: totalMonthWorkingDays,
      holidays: totalMonthHolidays
    },
    branchMatrix,
    kpi: {
      totalBranches: activeBranches.length,
      totalBilled: totalBilledMonth,
      totalPaid: totalPaidMonth,
      totalRemaining: totalRemainingMonth,
      lunasCount,
      kurangBayarCount: activeBranches.length - lunasCount,
      paymentPercentage
    }
  };
}

// Backward compatibility helper
export async function getCompleteRecapData(year, month, periodIndex = 1) {
  const matrix = await getFullMonthMatrixData(year, month);
  const periods = generatePeriodsForMonth(year, month);
  const currentPeriod = periods.find(p => p.period_index === periodIndex) || periods[0];

  const branchRecaps = matrix.branchMatrix.map(b => {
    // Filter hari dalam periode terpilih
    const periodEntries = b.dailyEntries.filter(e => e.dayNumber >= currentPeriod.start_day && e.dayNumber <= currentPeriod.end_day);
    const activeDays = periodEntries.filter(e => !e.isHoliday).length;
    const totalBilling = b.branch.daily_deposit * activeDays;
    const totalPaid = periodEntries.reduce((sum, e) => sum + e.amount, 0);
    const remainingAmount = Math.max(0, totalBilling - totalPaid);
    const isLunas = totalPaid >= totalBilling && totalBilling > 0;

    return {
      branch: b.branch,
      activeDays,
      dailyDeposit: b.branch.daily_deposit,
      totalBilling,
      totalPaid,
      remainingAmount,
      isLunas,
      status: isLunas ? 'LUNAS' : (totalPaid > 0 ? 'SEBAGIAN' : 'BELUM_BAYAR'),
      payments: periodEntries.filter(e => e.payment).map(e => e.payment)
    };
  });

  const totalBilled = branchRecaps.reduce((sum, r) => sum + r.totalBilling, 0);
  const totalPaid = branchRecaps.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalRemaining = branchRecaps.reduce((sum, r) => sum + r.remainingAmount, 0);
  const lunasCount = branchRecaps.filter(r => r.isLunas).length;
  const paymentPercentage = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  return {
    year,
    month,
    period: currentPeriod,
    periods,
    config: matrix.holidayConfig,
    dayStats: {
      totalCalendarDays: currentPeriod.total_calendar_days,
      activeDays: matrix.stats.workingDays,
      holidaysCount: matrix.stats.holidays
    },
    branchRecaps,
    kpi: {
      totalBranches: matrix.branchMatrix.length,
      totalBilled,
      totalPaid,
      totalRemaining,
      lunasCount,
      kurangBayarCount: matrix.branchMatrix.length - lunasCount,
      paymentPercentage
    }
  };
}

export async function savePeriodConfig(year, month, periodIndex, newConfig) {
  return saveMonthHolidayConfig(year, month, newConfig);
}

export async function addPayment(payment) {
  return saveDailyPaymentRecord({
    branchId: payment.branchId,
    dateStr: payment.paymentDate || `${payment.year}-${String(payment.month).padStart(2, '0')}-01`,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes
  });
}

export async function deletePayment(paymentId) {
  const allPayments = getLocalItem(STORAGE_KEYS.PAYMENTS, []);
  const filtered = allPayments.filter(p => p.id !== paymentId);
  setLocalItem(STORAGE_KEYS.PAYMENTS, filtered);
  return filtered;
}
