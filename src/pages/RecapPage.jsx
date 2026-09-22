import React, { useState } from 'react';
import { 
  Phone, Send, Check, Edit2, Plus, CheckCircle2, AlertCircle, 
  HelpCircle, Sparkles, ChevronLeft, ChevronRight, Filter, Calendar,
  FileSpreadsheet, Download
} from 'lucide-react';
import HolidayManager from '../components/HolidayManager';
import DailyPaymentModal from '../components/DailyPaymentModal';
import { formatRupiah, MONTH_NAMES, SHORT_DAY_NAMES, generateMonthSequence } from '../lib/initialData';
import { buildWaMessage, getWaUrl } from '../lib/waHelper';
import { exportRecapToExcel } from '../lib/excelExport';

// Generate sekuens bulan berkesinambungan otomatis (Oktober 2026 -> Desember 2026 -> Januari 2027 otomatis!)
const MONTH_SEQUENCE = generateMonthSequence(2026, 10, 18);

export default function RecapPage({
  monthMatrixData,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  onSelectMonthAndYear,
  onUpdatePeriodConfig,
  onToggleDailyPayment,
  onSaveDailyPayment,
  onQuickFillBranch,
  onOpenEditBranch,
  onOpenAddBranch
}) {
  const [activeCycleFilter, setActiveCycleFilter] = useState('ALL'); // 'ALL' or cycleNumber
  const [selectedCellForModal, setSelectedCellForModal] = useState(null);

  if (!monthMatrixData) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { daysList, cyclesList, branchMatrix, stats, kpi, holidayConfig } = monthMatrixData;
  const currentMonthName = MONTH_NAMES[selectedMonth - 1];

  // Helper navigasi bulan & tahun
  const setMonthAndYear = (m, y) => {
    if (onSelectMonthAndYear) {
      onSelectMonthAndYear(m, y);
    } else {
      onSelectMonth(m);
      onSelectYear(y);
    }
  };

  // Batas awal timeline: Oktober 2026 adalah Periode 1
  const isEarliestMonth = selectedYear === 2026 && selectedMonth <= 10;

  const handlePrevMonth = () => {
    if (isEarliestMonth) return;
    if (selectedMonth === 1) {
      setMonthAndYear(12, selectedYear - 1);
    } else {
      setMonthAndYear(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setMonthAndYear(1, selectedYear + 1);
    } else {
      setMonthAndYear(selectedMonth + 1, selectedYear);
    }
  };

  // Deteksi live hari ini (jika hari ini sebelum Oktober 2026, default ke Oktober 2026)
  const realNow = new Date();
  const todayEffectiveYear = realNow.getFullYear() < 2026 || (realNow.getFullYear() === 2026 && (realNow.getMonth() + 1) < 10) ? 2026 : realNow.getFullYear();
  const todayEffectiveMonth = realNow.getFullYear() < 2026 || (realNow.getFullYear() === 2026 && (realNow.getMonth() + 1) < 10) ? 10 : (realNow.getMonth() + 1);
  const isViewingToday = selectedYear === todayEffectiveYear && selectedMonth === todayEffectiveMonth;

  const handleJumpToToday = () => {
    setMonthAndYear(todayEffectiveMonth, todayEffectiveYear);
  };

  // Filter kolom hari jika user memfilter siklus 14 hari tertentu
  const filteredDays = activeCycleFilter === 'ALL'
    ? daysList
    : daysList.filter(d => d.cycleInfo.cycleNumber === Number(activeCycleFilter));

  // Handler kirim WA penagihan dengan rincian hari yang belum setor
  const handleSendWa = (b) => {
    const message = buildWaMessage({
      branchName: b.branch.name,
      picName: b.branch.pic_name,
      monthName: currentMonthName,
      year: selectedYear,
      dailyDeposit: b.branch.daily_deposit,
      activeDays: b.workingDaysCount,
      totalBilling: b.totalBilling,
      totalPaid: b.totalPaid,
      remainingAmount: b.remainingAmount,
      isLunas: b.isLunas,
      unpaidDates: b.unpaidWorkingDates
    });

    const url = getWaUrl(b.branch.phone_wa, message);
    if (!url) {
      alert(`Nomor WhatsApp untuk ${b.branch.name} belum valid.`);
      return;
    }
    window.open(url, '_blank');
  };

  // Handler klik pada sel tanggal (1-klik cepat toggle bayar)
  const handleCellClick = (branch, dayObj, entry) => {
    if (dayObj.isHoliday) {
      // Jika hari libur, buka modal informasi jika mau input khusus
      setSelectedCellForModal({
        branch,
        dateStr: dayObj.dateStr,
        dayNumber: dayObj.dayNumber,
        isHoliday: true,
        entry
      });
      return;
    }

    // Hari kerja: Jika belum bayar, langsung toggle isi setoran penuh instan!
    if (!entry.isPaid) {
      onToggleDailyPayment({
        branchId: branch.id,
        dateStr: dayObj.dateStr,
        defaultAmount: branch.daily_deposit
      });
    } else {
      // Jika sudah bayar, buka modal edit / opsi hapus
      setSelectedCellForModal({
        branch,
        dateStr: dayObj.dateStr,
        dayNumber: dayObj.dayNumber,
        isHoliday: false,
        entry
      });
    }
  };

  // Quick fill semua hari kerja bulan ini untuk satu cabang
  const handleQuickFillBranchWorkingDays = (branch) => {
    const workingDates = daysList.filter(d => !d.isHoliday).map(d => d.dateStr);
    if (confirm(`Tandai seluruh hari kerja aktif (${workingDates.length} hari) sudah setor untuk ${branch.name}?`)) {
      onQuickFillBranch(branch.id, workingDates, branch.daily_deposit);
    }
  };

  // Handler Ekspor Excel (Mendukung 1 Bulan Penuh maupun Per Periode)
  const handleExportExcel = (filterMode = activeCycleFilter) => {
    exportRecapToExcel({
      monthMatrixData,
      selectedYear,
      selectedMonth,
      cycleFilter: filterMode
    });
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Tab Pilihan Bulan (Tahun Otomatis & Live Hari Ini) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Rekap Pembayaran Harian 1 Bulan Penuh
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                {currentMonthName} {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input setoran harian setiap cabang secara langsung. Dikelompokkan berkesinambungan per 14 hari.
            </p>
          </div>

          {/* Kontrol Cepat: Navigasi Bulan, Tahun & Hari Ini */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Tombol Lompat ke Hari Ini (Live) */}
            <button
              type="button"
              onClick={handleJumpToToday}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isViewingToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Kembali ke Bulan & Hari Ini (Real-Time Live)"
            >
              <span className={`w-2 h-2 rounded-full ${isViewingToday ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isViewingToday ? 'Live Hari Ini' : 'Hari Ini'}</span>
            </button>

            {/* Tombol Mundur/Maju 1 Bulan (Mulus melewati pergantian tahun) */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isEarliestMonth}
                className={`p-1 rounded-md transition ${
                  isEarliestMonth 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isEarliestMonth ? 'Batas awal timeline: Oktober 2026 (Periode 1)' : 'Bulan Sebelumnya'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Tahun */}
            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = Number(e.target.value);
                const newMonth = (newYear === 2026 && selectedMonth < 10) ? 10 : selectedMonth;
                setMonthAndYear(newMonth, newYear);
              }}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
              <option value={2029}>2029</option>
              <option value={2030}>2030</option>
            </select>

            {/* Tombol Tambah Cabang */}
            <button
              onClick={onOpenAddBranch}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Cabang</span>
            </button>
          </div>
        </div>

        {/* Tab Nama Bulan Berkesinambungan (Tahun otomatis menyesuaikan, misal Januari -> 2027) */}
        <div className="mt-3 flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {MONTH_SEQUENCE.map((m) => {
            const isActive = selectedYear === m.year && selectedMonth === m.month;
            return (
              <button
                key={`${m.year}-${m.month}`}
                onClick={() => setMonthAndYear(m.month, m.year)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={`Pilih ${m.monthName} ${m.year}`}
              >
                <span>{m.monthName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {m.year}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Kalender Hari Libur (Klik Tanggal Merah) */}
      <HolidayManager
        year={selectedYear}
        month={selectedMonth}
        period={{ start_day: 1, end_day: daysList.length }}
        config={holidayConfig}
        dayStats={{
          activeDays: stats.workingDays,
          holidaysCount: stats.holidays
        }}
        onUpdateConfig={onUpdatePeriodConfig}
      />

      {/* 3. Matrix Rekapan Pembayaran Harian 1 Bulan Penuh */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        
        {/* Baris Filter Siklus 14 Hari & Tombol Unduh Excel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-100">
          
          {/* Kelompok Pilihan Rentang Hari: 1 Bulan Penuh & Periode 1, 2, dst. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">
              Rentang Hari:
            </span>
            
            {/* Tombol 1 Bulan Penuh */}
            <button
              type="button"
              onClick={() => setActiveCycleFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition flex flex-col items-center justify-center text-center ${
                activeCycleFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'
              }`}
            >
              <span>1 Bulan Penuh</span>
              <span className={`text-[10px] leading-tight ${activeCycleFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                {daysList.length} Hari
              </span>
            </button>

            {/* Tombol Tiap Periode (Periode 1, Periode 2, dst. dengan tanggal di bawahnya) */}
            {cyclesList.map((c) => {
              const isSelected = activeCycleFilter === String(c.cycleNumber);
              return (
                <button
                  key={c.cycleNumber}
                  type="button"
                  onClick={() => setActiveCycleFilter(String(c.cycleNumber))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs transition flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'
                  }`}
                >
                  <span>Periode {c.cycleNumber}</span>
                  <span className={`text-[10px] leading-tight ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tombol Unduh Excel Cepat Berdasarkan Tampilan Aktif */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleExportExcel(activeCycleFilter)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition shadow-sm"
              title={`Unduh file Excel susunan sama persis dengan tabel untuk ${
                activeCycleFilter === 'ALL' ? '1 Bulan Penuh' : `Periode ${activeCycleFilter}`
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                Unduh Excel ({activeCycleFilter === 'ALL' ? '1 Bulan Penuh' : `Periode ${activeCycleFilter}`})
              </span>
            </button>
          </div>

        </div>

        {/* Sub-header & Petunjuk 1-Klik */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Setoran Harian Cabang ({currentMonthName} {selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              💡 <span className="font-semibold text-slate-700">Cara Cepat:</span> Klik sel tanggal hari kerja untuk langsung menandai setor penuh. Klik lagi untuk mengedit / menghapus.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
              <span className="text-slate-600">Sudah Setor</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block"></span>
              <span className="text-slate-600">Belum Setor</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"></span>
              <span className="text-slate-600">Libur (Bebas Setor)</span>
            </span>
          </div>
        </div>

        {/* Matrix Spreadsheet Harian (Horizontal Scrollable) */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[650px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-50">
              
              {/* Baris 1: Header Pengelompokan Siklus 14 Hari */}
              <tr className="border-b border-slate-200 text-slate-700 text-[11px] font-bold">
                <th className="py-2 px-3 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 min-w-[200px]" rowSpan={2}>
                  Cabang MBG & Tarif Harian
                </th>
                
                {cyclesList.map(c => {
                  const daysInThisCycle = filteredDays.filter(d => d.cycleInfo.cycleNumber === c.cycleNumber);
                  if (daysInThisCycle.length === 0) return null;
                  return (
                    <th 
                      key={c.cycleNumber} 
                      colSpan={daysInThisCycle.length}
                      className="py-1.5 px-2 text-center bg-blue-50/70 border-r border-blue-200 text-blue-900 font-extrabold uppercase tracking-wider"
                    >
                      <span className="block text-xs font-black">Periode {c.cycleNumber}</span>
                      <span className="block text-[10px] font-normal text-slate-500 normal-case">
                        {c.label}
                      </span>
                    </th>
                  );
                })}

                <th className="py-2 px-3 sticky right-0 z-30 bg-slate-100 border-l border-slate-200 text-center min-w-[240px]" rowSpan={2}>
                  Total Rekap & Aksi WA
                </th>
              </tr>

              {/* Baris 2: Nomor Tanggal & Hari (1..31) dengan Deteksi Hari Ini */}
              <tr className="border-b border-slate-200 text-[10px]">
                {filteredDays.map((d) => {
                  const isSun = d.dayOfWeek === 0;
                  const isToday = d.isToday;
                  return (
                    <th
                      key={d.dayNumber}
                      className={`py-2 px-1 text-center min-w-[36px] border-r border-slate-200 transition-colors ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-500 ring-inset'
                          : d.isHoliday
                          ? 'bg-red-50 text-red-700 font-bold'
                          : 'text-slate-600'
                      }`}
                      title={`${d.dateStr} (${d.isHoliday ? 'Libur' : 'Hari Kerja'})${isToday ? ' - HARI INI' : ''}`}
                    >
                      {isToday && (
                        <span className="block text-[8px] uppercase tracking-wider text-blue-100 font-extrabold -mb-0.5">
                          Hari Ini
                        </span>
                      )}
                      <span className="block font-bold text-xs">{d.dayNumber}</span>
                      <span className={`block uppercase font-medium ${isToday ? 'text-blue-100' : isSun ? 'text-red-500' : 'text-slate-400'}`}>
                        {SHORT_DAY_NAMES[d.dayOfWeek]}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {branchMatrix.map((b) => {
                const isLunas = b.isLunas;
                return (
                  <tr 
                    key={b.branch.id} 
                    className={`hover:bg-slate-50/80 transition ${isLunas ? 'bg-emerald-50/20' : ''}`}
                  >
                    {/* Kolom Kiri Sticky: Identitas Cabang & Setoran Tetap */}
                    <td className="py-2.5 px-3 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-start justify-between">
                        <div>
                          <button
                            onClick={() => onOpenEditBranch(b.branch)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left transition text-xs block"
                            title="Klik untuk edit cabang"
                          >
                            {b.branch.name}
                          </button>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[11px] font-semibold text-blue-700">
                              {formatRupiah(b.branch.daily_deposit)}/hari
                            </span>
                            <span className="text-[10px] text-slate-400">• {b.branch.pic_name || 'PIC'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleQuickFillBranchWorkingDays(b.branch)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                          title="Tandai semua hari kerja bulan ini lunas"
                        >
                          +Semua
                        </button>
                      </div>
                    </td>

                    {/* Kolom Tanggal (1..31) dengan Highlight Hari Ini */}
                    {filteredDays.map((d) => {
                      const entry = b.dailyEntries.find(e => e.dayNumber === d.dayNumber);
                      const isHoliday = d.isHoliday;
                      const isPaid = entry?.isPaid;
                      const isToday = d.isToday;

                      return (
                        <td
                          key={d.dayNumber}
                          className={`p-1 text-center border-r border-slate-200 transition ${
                            isToday
                              ? 'bg-blue-50/40'
                              : isHoliday
                              ? 'bg-red-50/50'
                              : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleCellClick(b.branch, d, entry)}
                            title={`Tgl ${d.dayNumber}: ${
                              isHoliday 
                                ? 'Hari Libur (Bebas Setoran)' 
                                : isPaid 
                                ? `Sudah Setor: ${formatRupiah(entry.amount)}` 
                                : `Belum Setor (Kewajiban: ${formatRupiah(b.branch.daily_deposit)})`
                            }${isToday ? ' [HARI INI]' : ''}`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-bold flex items-center justify-center mx-auto transition-all relative ${
                              isToday ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''
                            } ${
                              isHoliday
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : isPaid
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {isHoliday ? (
                              <span className="text-[9px]">Libur</span>
                            ) : isPaid ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span>-</span>
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Kolom Kanan Sticky: Ringkasan Total & Aksi WA */}
                    <td className="py-2.5 px-3 sticky right-0 z-10 bg-white border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {formatRupiah(b.totalPaid)}
                            </span>
                            {isLunas ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                Lunas
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                                Kurang {formatRupiah(b.remainingAmount)}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Setor: {b.paidWorkingDaysCount}/{b.workingDaysCount} hari aktif
                          </div>
                        </div>

                        {/* Tombol Kirim Tagihan WA */}
                        <button
                          onClick={() => handleSendWa(b)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isLunas
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                          title={isLunas ? 'Kirim Laporan Pelunasan ke WA' : 'Kirim Penagihan & Rincian Belum Setor ke WA'}
                        >
                          <Send className="w-3 h-3" />
                          <span>WA</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ringkasan Akumulasi Footer Table */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Total {branchMatrix.length} Cabang • {stats.workingDays} Hari Kerja Aktif ({stats.holidays} Hari Libur)
          </div>

          <div className="flex flex-wrap items-center gap-4 font-bold">
            <span className="text-slate-700">
              Total Kewajiban: <span className="text-slate-900">{formatRupiah(stats.totalBilling)}</span>
            </span>
            <span className="text-blue-700">
              Total Terkumpul: {formatRupiah(stats.totalPaid)}
            </span>
            <span className={stats.totalRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}>
              Sisa Tagihan: {formatRupiah(stats.totalRemaining)}
            </span>
          </div>
        </div>

      </div>

      {/* Modal Edit Detail / Hapus Pembayaran Harian */}
      <DailyPaymentModal
        isOpen={Boolean(selectedCellForModal)}
        onClose={() => setSelectedCellForModal(null)}
        cellData={selectedCellForModal}
        onSavePayment={onSaveDailyPayment}
      />

    </div>
  );
}
