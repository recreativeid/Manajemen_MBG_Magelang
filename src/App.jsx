import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import RecapPage from './pages/RecapPage';
import BranchModal from './components/BranchModal';
import PaymentModal from './components/PaymentModal';
import LoginPage from './components/LoginPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { 
  getFullMonthMatrixData,
  getCompleteRecapData, 
  saveMonthHolidayConfig, 
  toggleDailyPayment,
  saveDailyPaymentRecord,
  quickFillWorkingDaysForBranch,
  addPayment, 
  deletePayment, 
  saveBranch, 
  deleteBranch 
} from './lib/storageService';
import { checkIsLoggedIn, getAdminSession, logoutAdmin } from './lib/authService';
import { MONTH_NAMES } from './lib/initialData';

export default function App() {
  // Autentikasi Admin MBG
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkIsLoggedIn());
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('recap'); // Kelola Rekap Pembayaran langsung terbuka

  // Default otomatis mengikuti hari & tanggal real-time saat ini
  const realDate = new Date();
  const [selectedYear, setSelectedYear] = useState(realDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(realDate.getMonth() + 1);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(1);
  
  const [monthMatrixData, setMonthMatrixData] = useState(null);
  const [recapData, setRecapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals Cabang & Pembayaran
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBranchRecapForPayment, setSelectedBranchRecapForPayment] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [matrix, recap] = await Promise.all([
        getFullMonthMatrixData(selectedYear, selectedMonth),
        getCompleteRecapData(selectedYear, selectedMonth, selectedPeriodIndex)
      ]);
      setMonthMatrixData(matrix);
      setRecapData(recap);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [selectedYear, selectedMonth, selectedPeriodIndex, isAuthenticated]);

  // Handle Login & Logout
  const handleLoginSuccess = (session) => {
    setIsAuthenticated(true);
    setAdminSession(session);
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setAdminSession(null);
  };

  // Handle Pemilihan Bulan & Tahun Bersamaan (misal: Januari langsung 2027)
  const handleSelectMonthAndYear = (month, year) => {
    setSelectedMonth(month);
    if (year) {
      setSelectedYear(year);
    }
  };

  // Handle Update Holiday Config
  const handleUpdatePeriodConfig = async (newConfig) => {
    await saveMonthHolidayConfig(selectedYear, selectedMonth, newConfig);
    await fetchData();
  };

  // Handle 1-Click Toggle Daily Payment
  const handleToggleDailyPayment = async ({ branchId, dateStr, defaultAmount }) => {
    await toggleDailyPayment({ branchId, dateStr, defaultAmount });
    await fetchData();
  };

  // Handle Save / Edit Detailed Daily Payment
  const handleSaveDailyPayment = async (paymentPayload) => {
    await saveDailyPaymentRecord(paymentPayload);
    await fetchData();
  };

  // Handle Quick Fill All Working Days for a Branch
  const handleQuickFillBranch = async (branchId, dates, dailyDeposit) => {
    await quickFillWorkingDaysForBranch(branchId, dates, dailyDeposit);
    await fetchData();
  };

  // Handle Add Period Payment (Modal)
  const handleAddPayment = async (paymentPayload) => {
    await addPayment(paymentPayload);
    await fetchData();
    setIsPaymentModalOpen(false);
  };

  // Handle Delete Payment
  const handleDeletePayment = async (paymentId) => {
    await deletePayment(paymentId);
    await fetchData();
  };

  // Handle Save Branch (Create / Edit)
  const handleSaveBranch = async (branchData) => {
    await saveBranch(branchData);
    await fetchData();
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  // Handle Delete Branch
  const handleDeleteBranch = async (branchId) => {
    await deleteBranch(branchId);
    await fetchData();
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  const handleOpenEditBranch = (branch) => {
    setEditingBranch(branch);
    setIsBranchModalOpen(true);
  };

  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setIsBranchModalOpen(true);
  };

  const handleOpenPaymentModal = (branchRecap) => {
    setSelectedBranchRecapForPayment(branchRecap);
    setIsPaymentModalOpen(true);
  };

  // Jika belum login, tampilkan layar login admin
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar Minimalis SaaS dengan Logo Resmi BGN & Kontrol Admin */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBranch={handleOpenAddBranch}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        adminSession={adminSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'dashboard' ? (
          <DashboardPage
            recapData={recapData}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedPeriodIndex={selectedPeriodIndex}
            onSelectMonth={setSelectedMonth}
            onSelectMonthAndYear={handleSelectMonthAndYear}
            onSelectPeriod={setSelectedPeriodIndex}
            onNavigateToRecap={() => setActiveTab('recap')}
            onOpenPaymentModal={handleOpenPaymentModal}
          />
        ) : (
          <RecapPage
            monthMatrixData={monthMatrixData}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            onSelectMonthAndYear={handleSelectMonthAndYear}
            onUpdatePeriodConfig={handleUpdatePeriodConfig}
            onToggleDailyPayment={handleToggleDailyPayment}
            onSaveDailyPayment={handleSaveDailyPayment}
            onQuickFillBranch={handleQuickFillBranch}
            onOpenEditBranch={handleOpenEditBranch}
            onOpenAddBranch={handleOpenAddBranch}
          />
        )}
      </main>

      {/* Footer Minimalis */}
      <footer className="border-t border-slate-100 py-3 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {selectedYear} Badan Gizi Nasional • MBG Magelang • Rekapan Harian 1 Bulan & Siklus 14 Hari Berkelanjutan</p>
        </div>
      </footer>

      {/* Modals Cabang */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => {
          setIsBranchModalOpen(false);
          setEditingBranch(null);
        }}
        onSave={handleSaveBranch}
        onDelete={handleDeleteBranch}
        branch={editingBranch}
      />

      {/* Modal Pembayaran Periode */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedBranchRecapForPayment(null);
        }}
        branchRecap={selectedBranchRecapForPayment}
        period={recapData?.period || { title: '', period_index: selectedPeriodIndex }}
        monthName={MONTH_NAMES[selectedMonth - 1]}
        year={selectedYear}
        onAddPayment={handleAddPayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Modal Pengaturan Ganti Kata Sandi Admin */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
