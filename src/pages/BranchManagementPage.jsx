import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Plus, 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatRupiah, MONTH_NAMES } from '../lib/initialData';
import { getContinuousCycleInfo } from '../lib/storageService';
import { sanitizeWaNumber } from '../lib/waHelper';

export default function BranchManagementPage({
  monthMatrixData,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
  onSelectMonthAndYear,
  onOpenAddBranch,
  onOpenEditBranch,
  onRequestDeleteBranch
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL'); // 'ALL' | 'CURRENT' | '1' | '2' | ...
  const [sortBy, setSortBy] = useState('remaining-desc'); // 'remaining-desc' | 'remaining-asc' | 'paid-desc' | 'deposit-desc' | 'name-asc' | 'name-desc'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LUNAS' | 'BELUM_LUNAS'

  // Hitung informasi periode live saat ini secara real-time
  const realDate = new Date();
  const liveCycleInfo = useMemo(() => {
    const isBeforeStart = realDate.getFullYear() < 2026 || (realDate.getFullYear() === 2026 && (realDate.getMonth() + 1) < 10);
    const cycle = getContinuousCycleInfo(realDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formattedDate = `${realDate.getDate()} ${months[realDate.getMonth()]} ${realDate.getFullYear()}`;

    return {
      isBeforeStart,
      cycleNumber: cycle.cycleNumber,
      cycleLabel: cycle.cycleLabel,
      todayFormatted: formattedDate,
      activeLiveCycle: isBeforeStart ? 1 : cycle.cycleNumber
    };
  }, []);

  if (!monthMatrixData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { branchMatrix, cyclesList, daysList } = monthMatrixData;
  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Tentukan nomor siklus target yang aktif sesuai filter
  const targetCycleNumber = useMemo(() => {
    if (periodFilter === 'ALL') return null;
    if (periodFilter === 'CURRENT') return liveCycleInfo.activeLiveCycle;
    return Number(periodFilter);
  }, [periodFilter, liveCycleInfo]);

  // Kalkulasi data keuangan tiap cabang berdasarkan filter periode terpilih
  const branchRows = useMemo(() => {
    return branchMatrix.map((item) => {
      const branch = item.branch;

      if (targetCycleNumber === null) {
        // Seluruh Periode (1 Bulan Penuh)
        return {
          branch,
          activeDays: item.workingDaysCount,
          paidDays: item.paidWorkingDaysCount,
          totalBilling: item.totalBilling,
          totalPaid: item.totalPaid,
          remainingAmount: item.remainingAmount,
          isLunas: item.isLunas
        };
      }

      // Filter per siklus tertentu
      const cycleEntries = item.dailyEntries.filter(e => e.cycleNumber === targetCycleNumber);
      const activeDays = cycleEntries.filter(e => !e.isHoliday).length;
      const paidDays = cycleEntries.filter(e => !e.isHoliday && e.isPaid).length;
      const totalBilling = activeDays * branch.daily_deposit;
      const totalPaid = cycleEntries.reduce((sum, e) => sum + (e.isPaid ? Number(e.amount || 0) : 0), 0);
      const remainingAmount = Math.max(0, totalBilling - totalPaid);
      const isLunas = totalPaid >= totalBilling && totalBilling > 0;

      return {
        branch,
        activeDays,
        paidDays,
        totalBilling,
        totalPaid,
        remainingAmount,
        isLunas
      };
    });
  }, [branchMatrix, targetCycleNumber]);

  // Filter pencarian dan status
  const filteredRows = useMemo(() => {
    return branchRows.filter(row => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        row.branch.name.toLowerCase().includes(q) ||
        (row.branch.address && row.branch.address.toLowerCase().includes(q)) ||
        (row.branch.phone_wa && row.branch.phone_wa.includes(q));

      const matchStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'LUNAS' ? row.isLunas :
        !row.isLunas;

      return matchSearch && matchStatus;
    });
  }, [branchRows, searchQuery, statusFilter]);

  // Pengurutan (Sortir)
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (sortBy === 'remaining-desc') {
        return b.remainingAmount - a.remainingAmount;
      }
      if (sortBy === 'remaining-asc') {
        return a.remainingAmount - b.remainingAmount;
      }
      if (sortBy === 'paid-desc') {
        return b.totalPaid - a.totalPaid;
      }
      if (sortBy === 'deposit-desc') {
        return b.branch.daily_deposit - a.branch.daily_deposit;
      }
      if (sortBy === 'name-asc') {
        return a.branch.name.localeCompare(b.branch.name, 'id');
      }
      if (sortBy === 'name-desc') {
        return b.branch.name.localeCompare(a.branch.name, 'id');
      }
      return 0;
    });
  }, [filteredRows, sortBy]);

  // Kalkulasi KPI Agregat
  const totalBranches = branchMatrix.length;
  const totalObligation = branchRows.reduce((sum, r) => sum + r.totalBilling, 0);
  const totalCollected = branchRows.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalRemaining = branchRows.reduce((sum, r) => sum + r.remainingAmount, 0);
  const lunasCount = branchRows.filter(r => r.isLunas).length;
  const unpaidCount = branchRows.filter(r => !r.isLunas).length;

  // Label periode aktif untuk banner/header
  const currentPeriodLabel = useMemo(() => {
    if (periodFilter === 'ALL') {
      return `Seluruh Periode Bulan ${monthName} ${selectedYear} (${daysList.length} Hari)`;
    }
    if (periodFilter === 'CURRENT') {
      if (liveCycleInfo.isBeforeStart) {
        return `Periode 1 (${liveCycleInfo.cycleLabel}) - Mulai 1 Oktober 2026`;
      }
      return `Periode Saat Ini: Periode ${liveCycleInfo.cycleNumber} (${liveCycleInfo.cycleLabel})`;
    }
    const foundCycle = cyclesList.find(c => c.cycleNumber === Number(periodFilter));
    return `Periode ${periodFilter} (${foundCycle ? foundCycle.label : ''})`;
  }, [periodFilter, monthName, selectedYear, daysList.length, liveCycleInfo, cyclesList]);

  // Handler buka WhatsApp dengan pesan ringkasan
  const handleOpenWaChat = (row) => {
    const cleanPhone = sanitizeWaNumber(row.branch.phone_wa);
    if (!cleanPhone) {
      alert(`Nomor WhatsApp untuk cabang ${row.branch.name} belum valid.`);
      return;
    }

    const message = encodeURIComponent(
`*INFORMASI REKAPAN PEMBAYARAN MBG*
Kabupaten / Kota Magelang

Halo Yth. Pengelola *${row.branch.name}*,
Alamat: ${row.branch.address || '-'}

Berikut rincian rekapan setoran Makan Bergizi Gratis (${currentPeriodLabel}):
💰 Tarif Harian: ${formatRupiah(row.branch.daily_deposit)}/hari
📅 Hari Kerja Wajib: ${row.activeDays} hari (${row.paidDays} hari disetor)
📊 Total Kewajiban: ${formatRupiah(row.totalBilling)}
💵 Total Disetor: ${formatRupiah(row.totalPaid)}
${row.isLunas ? '✅ *Status: LUNAS*' : `⚠️ *Sisa Kurang Bayar:* ${formatRupiah(row.remainingAmount)}`}

Terima kasih atas kerja sama dan dedikasinya. 🙏`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Header Halaman & Tombol Aksi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Kelola Cabang MBG Magelang
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan data cabang, alamat, kontak WhatsApp, tarif harian, dan ringkasan pembayaran per periode
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Tombol Tambah Cabang Baru */}
            <button
              onClick={onOpenAddBranch}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Cabang Baru</span>
            </button>
          </div>
        </div>

        {/* Banner Status Deteksi Periode Saat Ini (Live Auto-detection) */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800">
                  Hari Ini: {liveCycleInfo.todayFormatted}
                </span>
                {liveCycleInfo.isBeforeStart ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Belum Berjalan
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                    Live Berjalan
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {liveCycleInfo.isBeforeStart 
                  ? 'Program MBG efektif dimulai per 1 Oktober 2026. Periode 1 (1 - 14 Okt 2026) akan otomatis berjalan saat tanggal memasuki Oktober.'
                  : `Sistem mendeteksi tanggal saat ini berada pada Siklus Periode ${liveCycleInfo.cycleNumber} (${liveCycleInfo.cycleLabel}).`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Pilihan Tampilan:</span>
            <button
              onClick={() => setPeriodFilter('CURRENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                periodFilter === 'CURRENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Periode Saat Ini</span>
            </button>
            <button
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                periodFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Seluruh Periode
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan KPI Keuangan Sesuai Filter Periode Terpilih */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Cabang Aktif
          </span>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
            {totalBranches} <span className="text-xs font-semibold text-slate-500">Cabang</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lunasCount} Lunas • {unpaidCount} Kurang Bayar
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Kewajiban ({periodFilter === 'ALL' ? '1 Bulan' : 'Periode Terpilih'})
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formatRupiah(totalObligation)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Target setoran tetap periode ini
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total Sudah Disetor
          </span>
          <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
            {formatRupiah(totalCollected)}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1">
            Realisasi pembayaran masuk
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${totalRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            Sisa Kekurangan
          </span>
          <p className={`text-lg sm:text-xl font-black mt-1 ${totalRemaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {totalRemaining > 0 ? formatRupiah(totalRemaining) : 'SEMUA LUNAS'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalRemaining > 0 ? `${unpaidCount} cabang belum lunas` : 'Seluruh cabang telah melunasi'}
          </p>
        </div>
      </div>

      {/* Bar Filter, Pencarian, dan Opsi Sortir */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Input Pencarian */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama cabang, alamat, atau no HP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Opsi Sortir & Status */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sortir Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-500">Sortir:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="remaining-desc">Kekurangan Terbesar</option>
                <option value="remaining-asc">Kekurangan Terkecil (Lunas Dulu)</option>
                <option value="paid-desc">Total Setoran Terbanyak</option>
                <option value="deposit-desc">Tarif Harian Tertinggi</option>
                <option value="name-asc">Nama Cabang (A - Z)</option>
                <option value="name-desc">Nama Cabang (Z - A)</option>
              </select>
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_LUNAS">⚠️ Ada Kekurangan</option>
              <option value="LUNAS">✅ Lunas</option>
            </select>
          </div>
        </div>

        {/* Tab Filter Periode yang Lengkap */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold whitespace-nowrap mr-1">
            Pilihan Periode:
          </span>
          <button
            onClick={() => setPeriodFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
              periodFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1 Bulan Penuh ({daysList.length} Hari)
          </button>
          <button
            onClick={() => setPeriodFilter('CURRENT')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
              periodFilter === 'CURRENT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Periode Saat Ini {liveCycleInfo.isBeforeStart ? '(1)' : `(${liveCycleInfo.cycleNumber})`}</span>
          </button>

          {cyclesList.map((c) => (
            <button
              key={c.cycleNumber}
              onClick={() => setPeriodFilter(String(c.cycleNumber))}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                periodFilter === String(c.cycleNumber)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Periode {c.cycleNumber} <span className="text-[10px] opacity-75 font-normal">({c.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Daftar Cabang MBG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Cabang MBG
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {sortedRows.length} Cabang
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {currentPeriodLabel}
          </span>
        </div>

        {sortedRows.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada cabang ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada cabang yang cocok dengan kata kunci pencarian atau filter status yang dipilih.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Cabang & Alamat MBG</th>
                  <th className="py-3 px-4 min-w-[150px]">Kontak WhatsApp</th>
                  <th className="py-3 px-4 min-w-[140px] text-right">Tarif Harian</th>
                  {/* Ujung Kanan: Total Pembayaran & Kekurangan */}
                  <th className="py-3 px-4 min-w-[150px] text-right bg-blue-50/40 text-blue-900">
                    Total Kewajiban
                  </th>
                  <th className="py-3 px-4 min-w-[150px] text-right bg-emerald-50/40 text-emerald-900">
                    Total Disetor
                  </th>
                  <th className="py-3 px-4 min-w-[160px] text-right bg-amber-50/40 text-amber-900">
                    Kekurangan (Kurang Bayar)
                  </th>
                  <th className="py-3 px-3.5 text-center min-w-[110px]">Status</th>
                  <th className="py-3 px-4 text-center min-w-[130px] sticky right-0 bg-slate-50 z-10 border-l border-slate-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedRows.map((row, index) => (
                  <tr 
                    key={row.branch.id} 
                    className={`hover:bg-slate-50/80 transition ${row.isLunas ? 'bg-emerald-50/10' : ''}`}
                  >
                    {/* No */}
                    <td className="py-3 px-3.5 text-center text-slate-400 font-bold">
                      {index + 1}
                    </td>

                    {/* Nama Cabang & Alamat */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {row.branch.name}
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{row.branch.address || 'Kecamatan di Wilayah Magelang'}</span>
                      </div>
                    </td>

                    {/* Kontak WhatsApp */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenWaChat(row)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                        title="Klik untuk chat WhatsApp tagihan"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{row.branch.phone_wa || '-'}</span>
                      </button>
                    </td>

                    {/* Tarif Harian Tetap */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-slate-900">
                        {formatRupiah(row.branch.daily_deposit)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/hari</span>
                    </td>

                    {/* Total Kewajiban */}
                    <td className="py-3 px-4 text-right bg-blue-50/20">
                      <span className="font-bold text-slate-900">
                        {formatRupiah(row.totalBilling)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {row.activeDays} hari kerja
                      </span>
                    </td>

                    {/* Total Sudah Disetor */}
                    <td className="py-3 px-4 text-right bg-emerald-50/20">
                      <span className="font-bold text-emerald-700">
                        {formatRupiah(row.totalPaid)}
                      </span>
                      <span className="text-[10px] text-emerald-600/70 block">
                        {row.paidDays} hari disetor
                      </span>
                    </td>

                    {/* Sisa Kurang Bayar (Kekurangan) */}
                    <td className="py-3 px-4 text-right bg-amber-50/20">
                      {row.remainingAmount > 0 ? (
                        <>
                          <span className="font-bold text-red-600">
                            {formatRupiah(row.remainingAmount)}
                          </span>
                          <span className="text-[10px] text-red-500 block">
                            Kurang {row.activeDays - row.paidDays} hari
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-emerald-700">
                          Rp 0 (Lunas)
                        </span>
                      )}
                    </td>

                    {/* Status Pelunasan */}
                    <td className="py-3 px-3.5 text-center">
                      {row.isLunas ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span>Kurang Bayar</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi (Edit & Hapus Cabang) */}
                    <td className="py-3 px-4 text-center sticky right-0 bg-white hover:bg-slate-50 z-10 border-l border-slate-200">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Tombol Edit */}
                        <button
                          type="button"
                          onClick={() => onOpenEditBranch(row.branch)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit nama cabang, alamat, no HP, atau tarif setoran"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Tombol Chat WA Ringkasan */}
                        <button
                          type="button"
                          onClick={() => handleOpenWaChat(row)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Kirim pesan ringkasan pembayaran via WA"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Tombol Hapus (dengan pop up persetujuan) */}
                        <button
                          type="button"
                          onClick={() => onRequestDeleteBranch(row.branch)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Hapus cabang (dengan konfirmasi)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
