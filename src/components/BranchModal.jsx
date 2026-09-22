import React, { useState, useEffect } from 'react';
import { X, Building, Phone, DollarSign, MapPin, Trash2 } from 'lucide-react';
import { formatRupiah } from '../lib/initialData';

export default function BranchModal({ isOpen, onClose, onSave, onRequestDelete, branch }) {
  const [formData, setFormData] = useState({
    name: '',
    phone_wa: '',
    daily_deposit: '',
    address: ''
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        phone_wa: branch.phone_wa || '',
        daily_deposit: branch.daily_deposit || '',
        address: branch.address || ''
      });
    } else {
      setFormData({
        name: '',
        phone_wa: '',
        daily_deposit: 2500000,
        address: ''
      });
    }
  }, [branch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.daily_deposit) {
      alert('Mohon isi nama cabang dan nominal setoran tetap harian.');
      return;
    }

    onSave({
      ...(branch ? { id: branch.id } : {}),
      name: formData.name.trim(),
      phone_wa: formData.phone_wa.trim(),
      daily_deposit: Number(formData.daily_deposit),
      address: formData.address.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {branch ? 'Edit Cabang MBG' : 'Tambah Cabang MBG Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola nama cabang, alamat, kontak WhatsApp, dan nominal setoran harian
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Nama Cabang */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nama Cabang MBG *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: MBG Mertoyudan Central"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Alamat Cabang */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Alamat Cabang MBG *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: Jl. Magelang - Yogyakarta Km. 7, Mertoyudan"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Nomor WhatsApp / HP */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nomor WhatsApp / HP Cabang *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="081234567890"
                value={formData.phone_wa}
                onChange={(e) => setFormData({ ...formData, phone_wa: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Nominal Setoran Harian Tetap */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nominal Setoran Tetap Per Hari (Rp) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                required
                min="0"
                step="50000"
                placeholder="2500000"
                value={formData.daily_deposit}
                onChange={(e) => setFormData({ ...formData, daily_deposit: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            {formData.daily_deposit > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Terbaca: <span className="text-slate-800 font-bold">{formatRupiah(formData.daily_deposit)}</span> / hari
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {branch ? (
              <button
                type="button"
                onClick={() => {
                  if (onRequestDelete) {
                    onRequestDelete(branch);
                  }
                }}
                className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Cabang</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                {branch ? 'Simpan Perubahan' : 'Tambah Cabang'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
