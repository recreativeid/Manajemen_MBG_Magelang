import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { formatRupiah } from '../lib/initialData';

export default function PaymentModal({
  isOpen,
  onClose,
  branchRecap,
  period,
  monthName,
  year,
  onAddPayment,
  onDeletePayment
}) {
  if (!isOpen || !branchRecap) return null;

  const { branch, activeDays, totalBilling, totalPaid, remainingAmount, isLunas, payments } = branchRecap;

  const [amount, setAmount] = useState(remainingAmount > 0 ? remainingAmount : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transfer BCA');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }

    onAddPayment({
      branchId: branch.id,
      year,
      month: period.month || 1,
      periodIndex: period.period_index,
      amount: numAmount,
      paymentDate,
      paymentMethod,
      notes: notes.trim()
    });

    setNotes('');
    setAmount('');
  };

  const handleQuickPayFull = () => {
    if (remainingAmount > 0) {
      setAmount(remainingAmount);
      setNotes('Pelunasan sisa setoran');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Input Setoran Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              {branch.name} • {monthName} {year} ({period.title})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Finansial Mini */}
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Kewajiban</span>
            <span className="font-bold text-slate-800">{formatRupiah(totalBilling)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Terbayar</span>
            <span className="font-bold text-emerald-600">{formatRupiah(totalPaid)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Kurang Bayar</span>
            <span className={`font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {remainingAmount > 0 ? formatRupiah(remainingAmount) : 'Lunas'}
            </span>
          </div>
        </div>

        {/* Form Input Pembayaran */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Form Pembayaran</span>
            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={handleQuickPayFull}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Isi Sisa Penuh ({formatRupiah(remainingAmount)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Nominal Setoran (Rp) *</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="10000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Tanggal Bayar *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Metode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="Transfer Mandiri">Transfer Mandiri</option>
                <option value="Transfer BRI">Transfer BRI</option>
                <option value="Transfer BNI">Transfer BNI</option>
                <option value="Transfer BSI">Transfer BSI</option>
                <option value="Setoran Tunai">Setoran Tunai</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Catatan / Bukti</label>
              <input
                type="text"
                placeholder="No. referensi transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              Simpan Pembayaran
            </button>
          </div>
        </form>

        {/* Riwayat Pembayaran */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Riwayat Setoran Periode Ini ({payments?.length || 0})
          </span>

          {payments && payments.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 mr-2">
                      {formatRupiah(p.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {p.paymentMethod} • {p.paymentDate}
                    </span>
                    {p.notes && <span className="text-[10px] text-slate-400 block">{p.notes}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus setoran ${formatRupiah(p.amount)}?`)) {
                        onDeletePayment(p.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-1">
              Belum ada catatan setoran pembayaran.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
