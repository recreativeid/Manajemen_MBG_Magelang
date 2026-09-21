import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Plus, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Navbar({ activeTab, setActiveTab, onOpenAddBranch }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Resmi Badan Gizi Nasional */}
          <div className="flex items-center">
            <img 
              src="/logo-bgn.png" 
              alt="Badan Gizi Nasional" 
              className="h-9 sm:h-11 w-auto object-contain" 
            />
          </div>

          {/* Navigasi Bersih: Dashboard vs Kelola Rekap Pembayaran */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-700" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('recap')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'recap'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-700" />
              <span>Kelola Rekap Pembayaran</span>
            </button>
          </nav>

          {/* Action Kanan: Tambah Cabang */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddBranch}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Cabang</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
