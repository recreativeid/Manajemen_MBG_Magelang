import React, { useState, useEffect } from 'react';
import { X, Building, Phone, User, DollarSign, MapPin, Trash2 } from 'lucide-react';
import { formatRupiah } from '../lib/initialData';

export default function BranchModal({ isOpen, onClose, onSave, onDelete, branch }) {
  const [formData, setFormData] = useState({
    name: '',
    pic_name: '',
    phone_wa: '',
    daily_deposit: '',
    address: ''
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        pic_name: branch.pic_name || '',
        phone_wa: branch.phone_wa || '',
        daily_deposit: branch.daily_deposit || '',
        address: branch.address || ''
      });
    } else {
      setFormData({
        name: '',
        pic_name: '',
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
      pic_name: formData.pic_name.trim(),
      phone_wa: formData.phone_wa.trim(),
      daily_deposit: Number(formData.daily_deposit),
      address: formData.address.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {branch ? 'Edit Cabang MBG' : 'Tambah Cabang MBG'}
            </h3>
            <p className="text-xs text-slate-500">
              Atur nama cabang, setoran harian, dan kontak WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          
          {/* Nama Cabang */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Cabang MBG *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: MBG Mertoyudan Central"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nominal Setoran Harian Tetap */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nominal Setoran Tetap Per Hari (Rp) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="50000"
              placeholder="3000000"
              value={formData.daily_deposit}
              onChange={(e) => setFormData({ ...formData, daily_deposit: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.daily_deposit > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Terbaca: <span className="text-slate-800 font-semibold">{formatRupiah(formData.daily_deposit)}</span> / hari
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PIC */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                type="text"
                placeholder="Pak Slamet"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nomor WA */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor WhatsApp *
              </label>
              <input
                type="text"
                required
                placeholder="081234567890"
                value={formData.phone_wa}
                onChange={(e) => setFormData({ ...formData, phone_wa: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat / Lokasi
            </label>
            <input
              type="text"
              placeholder="Kecamatan Mertoyudan, Magelang"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {branch ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus cabang ${branch.name}?`)) {
                    onDelete(branch.id);
                    onClose();
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Hapus Cabang
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                {branch ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
