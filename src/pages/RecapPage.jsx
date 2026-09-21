import React, { useState } from 'react';
import { 
  Phone, Send, Check, Edit2, Plus, CheckCircle2, AlertCircle, 
  HelpCircle, Sparkles, ChevronRight, Filter
} from 'lucide-react';
import HolidayManager from '../components/HolidayManager';
import DailyPaymentModal from '../components/DailyPaymentModal';
import { formatRupiah, MONTH_NAMES, SHORT_DAY_NAMES } from '../lib/initialData';
import { buildWaMessage, getWaUrl } from '../lib/waHelper';

const ORDERED_MONTHS = [
  { index: 10, name: 'Oktober' },
  { index: 11, name: 'November' },
  { index: 12, name: 'Desember' },
  { index: 1, name: 'Januari' },
  { index: 2, name: 'Februari' },
  { index: 3, name: 'Maret' },
  { index: 4, name: 'April' },
  { index: 5, name: 'Mei' },
  { index: 6, name: 'Juni' },
  { index: 7, name: 'Juli' },
  { index: 8, name: 'Agustus' },
  { index: 9, name: 'September' },
];

export default function RecapPage({
  monthMatrixData,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
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

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Tab Pilihan Bulan (Mulai Oktober) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Rekap Pembayaran Harian 1 Bulan Penuh
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                {currentMonthName} {selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input setoran harian setiap cabang secara langsung. Dikelompokkan berkesinambungan per 14 hari.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(Number(e.target.value))}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            <button
              onClick={onOpenAddBranch}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Cabang</span>
            </button>
          </div>
        </div>

        {/* Tab Nama Bulan (Scrollable di Mobile) */}
        <div className="mt-3 flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1">
          {ORDERED_MONTHS.map((m) => {
            const isActive = selectedMonth === m.index;
            return (
              <button
                key={m.index}
                onClick={() => onSelectMonth(m.index)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {m.name}
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
        
        {/* Baris Filter Siklus 14 Hari (Di Bawah Kalender, Menyambung ke Tabel, Tanpa Tagar) */}
        <div className="flex flex-wrap items-center gap-1.5 pb-3.5 mb-3.5 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1.5">
            Rentang Hari:
          </span>
          <button
            onClick={() => setActiveCycleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCycleFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            1 Bulan Penuh ({daysList.length} Hari)
          </button>

          {cyclesList.map((c) => {
            const isSelected = activeCycleFilter === String(c.cycleNumber);
            return (
              <button
                key={c.cycleNumber}
                onClick={() => setActiveCycleFilter(String(c.cycleNumber))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            );
          })}
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
                      {c.label}
                    </th>
                  );
                })}

                <th className="py-2 px-3 sticky right-0 z-30 bg-slate-100 border-l border-slate-200 text-center min-w-[240px]" rowSpan={2}>
                  Total Rekap & Aksi WA
                </th>
              </tr>

              {/* Baris 2: Nomor Tanggal & Hari (1..31) */}
              <tr className="border-b border-slate-200 text-[10px]">
                {filteredDays.map((d) => {
                  const isSun = d.dayOfWeek === 0;
                  return (
                    <th
                      key={d.dayNumber}
                      className={`py-2 px-1 text-center min-w-[34px] border-r border-slate-200 ${
                        d.isHoliday ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600'
                      }`}
                      title={`${d.dateStr} (${d.isHoliday ? 'Libur' : 'Hari Kerja'})`}
                    >
                      <span className="block font-bold text-xs">{d.dayNumber}</span>
                      <span className={`block uppercase font-medium ${isSun ? 'text-red-500' : 'text-slate-400'}`}>
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

                    {/* Kolom Tanggal (1..31) */}
                    {filteredDays.map((d) => {
                      const entry = b.dailyEntries.find(e => e.dayNumber === d.dayNumber);
                      const isHoliday = d.isHoliday;
                      const isPaid = entry?.isPaid;

                      return (
                        <td
                          key={d.dayNumber}
                          className={`p-1 text-center border-r border-slate-200 text-center transition ${
                            isHoliday ? 'bg-red-50/50' : ''
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
                            }`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-bold flex items-center justify-center mx-auto transition-all ${
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
                            <span className="text-[10px] text-slate-400">
                              / {formatRupiah(b.totalBilling)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500">
                              Terisi: {b.paidWorkingDaysCount}/{b.workingDaysCount} Hari
                            </span>
                            {isLunas ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                Lunas
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                                Kurang {formatRupiah(b.remainingAmount)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tombol WhatsApp Resmi */}
                        <button
                          onClick={() => handleSendWa(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-sm ${
                            isLunas
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          title={isLunas ? 'Kirim WA Laporan Lunas' : 'Tagih via WA dengan rincian tanggal belum setor'}
                        >
                          <Send className="w-3 h-3" />
                          <span>{isLunas ? 'WA' : 'Tagih'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row */}
            <tfoot className="sticky bottom-0 z-20 bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200 text-xs">
              <tr>
                <td className="py-2.5 px-3 sticky left-0 z-30 bg-slate-100 border-r border-slate-200">
                  TOTAL BULAN INI:
                </td>
                
                {filteredDays.map(d => {
                  const totalPaidOnDate = branchMatrix.reduce((sum, b) => {
                    const e = b.dailyEntries.find(entry => entry.dayNumber === d.dayNumber);
                    return sum + (e?.amount || 0);
                  }, 0);

                  return (
                    <td key={d.dayNumber} className="py-2 px-1 text-center border-r border-slate-200 text-[10px]">
                      {d.isHoliday ? (
                        <span className="text-red-500 font-bold">-</span>
                      ) : totalPaidOnDate > 0 ? (
                        <span className="text-blue-700 font-bold">{(totalPaidOnDate / 1000000).toFixed(0)}jt</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  );
                })}

                <td className="py-2.5 px-3 sticky right-0 z-30 bg-slate-100 border-l border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-blue-700 font-extrabold">{formatRupiah(kpi.totalPaid)}</span>
                      <span className="text-slate-400 text-[10px] block">
                        Kurang: <span className="text-red-600">{formatRupiah(kpi.totalRemaining)}</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                      {kpi.paymentPercentage}% Terbayar
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Keterangan Bawah */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-100 pt-2.5">
          <p>
            ℹ️ <span className="font-semibold">Info Siklus:</span> Pengelompokan 14 hari bersambung secara otomatis melintasi akhir bulan. Hari libur tidak dikenakan kewajiban setoran.
          </p>
          <p>
            Pesan WhatsApp otomatis menyertakan tanggal-tanggal yang belum disetor oleh cabang.
          </p>
        </div>

      </div>

      {/* Modal Input/Edit Setoran Harian */}
      <DailyPaymentModal
        isOpen={Boolean(selectedCellForModal)}
        onClose={() => setSelectedCellForModal(null)}
        cellData={selectedCellForModal}
        onSavePayment={onSaveDailyPayment}
      />

    </div>
  );
}
