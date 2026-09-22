import * as XLSX from 'xlsx';
import { MONTH_NAMES, SHORT_DAY_NAMES } from './initialData';

/**
 * Ekspor Rekapan MBG ke format file Microsoft Excel (.xlsx)
 * Mendukung ekspor 1 Bulan Penuh (30/31 hari) maupun Per Periode (14 hari)
 * dengan susunan kolom yang sama persis dengan tabel antarmuka.
 */
export function exportRecapToExcel({
  monthMatrixData,
  selectedYear,
  selectedMonth,
  cycleFilter = 'ALL'
}) {
  if (!monthMatrixData) return;

  const { daysList, cyclesList, branchMatrix, stats } = monthMatrixData;
  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Tentukan hari yang diekspor sesuai filter (1 Bulan Penuh atau Per Periode)
  const isAll = cycleFilter === 'ALL';
  const targetDays = isAll
    ? daysList
    : daysList.filter(d => d.cycleInfo.cycleNumber === Number(cycleFilter));

  const activeCycleObj = cyclesList.find(c => String(c.cycleNumber) === String(cycleFilter));
  const filterLabel = isAll
    ? `1 Bulan Penuh (${daysList.length} Hari)`
    : `Periode ${cycleFilter} (${activeCycleObj ? activeCycleObj.label : ''})`;

  // 1. Bangun Baris Data Excel (Array of Arrays)
  const rows = [];

  // Judul & Metadata Laporan
  rows.push(['BADAN GIZI NASIONAL - REKAPAN PEMBAYARAN MBG WILAYAH MAGELANG']);
  rows.push([`Bulan: ${monthName} ${selectedYear} | Tampilan: ${filterLabel}`]);
  rows.push([`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`]);
  rows.push([]); // Baris kosong

  // Header Tabel Baris 1: Informasi Dasar, Tanggal-Tanggal, dan Ringkasan
  const headerRow1 = [
    'No',
    'Nama Cabang MBG',
    'Penanggung Jawab (PIC)',
    'No. WhatsApp',
    'Tarif Setoran/Hari'
  ];

  // Header Tanggal
  targetDays.forEach(d => {
    const isSun = d.dayOfWeek === 0;
    const dayStatus = d.isHoliday ? ' (Libur)' : '';
    headerRow1.push(`Tgl ${d.dayNumber} [${SHORT_DAY_NAMES[d.dayOfWeek]}${dayStatus}]`);
  });

  // Header Total & Status
  headerRow1.push(
    'Total Hari Aktif',
    'Hari Sudah Setor',
    'Total Tagihan (Rp)',
    'Total Disetor (Rp)',
    'Sisa Kurang Bayar (Rp)',
    'Status Pelunasan'
  );

  rows.push(headerRow1);

  // 2. Baris Data Setiap Cabang
  let grandTotalBilling = 0;
  let grandTotalPaid = 0;
  let grandTotalRemaining = 0;

  branchMatrix.forEach((b, index) => {
    // Hitung statistik untuk targetDays yang sedang difilter
    let branchPaidInView = 0;
    let branchWorkingDaysInView = 0;
    let branchPaidDaysInView = 0;

    const rowData = [
      index + 1,
      b.branch.name,
      b.branch.pic_name || '-',
      b.branch.phone_wa || '-',
      b.branch.daily_deposit
    ];

    // Kolom per hari
    targetDays.forEach(d => {
      const entry = b.dailyEntries.find(e => e.dayNumber === d.dayNumber);
      if (d.isHoliday) {
        rowData.push('LIBUR');
      } else {
        branchWorkingDaysInView++;
        if (entry?.isPaid) {
          branchPaidInView += Number(entry.amount || b.branch.daily_deposit);
          branchPaidDaysInView++;
          rowData.push(Number(entry.amount || b.branch.daily_deposit));
        } else {
          rowData.push(0); // Belum setor
        }
      }
    });

    const branchBillingInView = branchWorkingDaysInView * b.branch.daily_deposit;
    const branchRemainingInView = Math.max(0, branchBillingInView - branchPaidInView);
    const isLunasInView = branchRemainingInView === 0;

    grandTotalBilling += branchBillingInView;
    grandTotalPaid += branchPaidInView;
    grandTotalRemaining += branchRemainingInView;

    // Kolom Ringkasan
    rowData.push(
      branchWorkingDaysInView,
      branchPaidDaysInView,
      branchBillingInView,
      branchPaidInView,
      branchRemainingInView,
      isLunasInView ? 'LUNAS' : 'KURANG BAYAR'
    );

    rows.push(rowData);
  });

  // 3. Baris Total Akumulasi
  const totalRow = [
    'TOTAL',
    `Total ${branchMatrix.length} Cabang`,
    '',
    '',
    ''
  ];

  // Kosongkan kolom hari pada baris total
  targetDays.forEach(() => {
    totalRow.push('');
  });

  totalRow.push(
    '',
    '',
    grandTotalBilling,
    grandTotalPaid,
    grandTotalRemaining,
    grandTotalRemaining === 0 ? 'SEMUA LUNAS' : 'ADA TUNGGAKAN'
  );

  rows.push(totalRow);

  // 4. Buat Worksheet & Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Atur Lebar Kolom (Auto Column Widths)
  const colWidths = [
    { wch: 5 },  // No
    { wch: 28 }, // Nama Cabang
    { wch: 18 }, // PIC
    { wch: 16 }, // No WA
    { wch: 18 }  // Tarif Harian
  ];

  targetDays.forEach(() => {
    colWidths.push({ wch: 14 }); // Kolom Tanggal
  });

  colWidths.push(
    { wch: 16 }, // Total Hari Aktif
    { wch: 16 }, // Hari Sudah Setor
    { wch: 20 }, // Total Tagihan
    { wch: 20 }, // Total Disetor
    { wch: 22 }, // Sisa Kurang Bayar
    { wch: 18 }  // Status
  );

  worksheet['!cols'] = colWidths;

  // Nama Sheet (Maksimal 31 karakter di Excel)
  const sheetName = isAll
    ? `Rekap ${monthName.slice(0, 3)} ${selectedYear}`
    : `Periode ${cycleFilter} ${monthName.slice(0, 3)}`;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 5. Nama File Excel
  const safeMonth = monthName.replace(/\s+/g, '_');
  const safeFilter = isAll ? '1_Bulan_Penuh' : `Periode_${cycleFilter}`;
  const fileName = `Rekap_MBG_Magelang_${safeMonth}_${selectedYear}_${safeFilter}.xlsx`;

  // Tulis dan unduh otomatis di browser
  XLSX.writeFile(workbook, fileName);
}
