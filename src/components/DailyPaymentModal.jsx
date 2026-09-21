import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, DollarSign } from 'lucide-react';
import { formatRupiah, DAY_NAMES } from '../lib/initialData';

export default function DailyPaymentModal({
  isOpen,
  onClose,
  cellData, // { branch, dateStr, dayNumber, dayOfWeek, isHoliday, entry }
  onSavePayment
}) {
  if (!isOpen || !cellData) return null;

  const { branch, dateStr, dayNumber, isHoliday, entry } = cellData;
  const dayName = DAY_NAMES[new Date(dateStr).getDay()];

  const [amount, setAmount] = useState(entry?.amount || branch.daily_deposit);
  const [paymentMethod, setPaymentMethod] = useState(entry?.payment?.paymentMethod || 'Transfer Bank');
  const [notes, setNotes] = useState(entry?.payment?.notes || '');

  useEffect(() => {
    if (entry && entry.isPaid) {
      setAmount(entry.amount);
      setPaymentMethod(entry.payment?.paymentMethod || 'Transfer Bank');
      setNotes(entry.payment?.notes || '');
    } else {
      setAmount(branch.daily_deposit);
      setPaymentMethod('Transfer Bank');
      setNotes('');
    }
  }, [cellData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSavePayment({
      branchId: branch.id,
      dateStr,
      amount: Number(amount || 0),
      paymentMethod,
      notes: notes.trim()
    });
    onClose();
  };

  const handleDelete = () => {
    onSavePayment({
      branchId: branch.id,
      dateStr,
      amount: 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Input Setoran Harian
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {branch.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Tanggal */}
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">{dayName}, {dateStr}</span>
            <span className="block text-[11px] text-slate-400">
              Tarif Tetap: {formatRupiah(branch.daily_deposit)}/hari
            </span>
          </div>
          {isHoliday ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
              Hari Libur
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              Hari Kerja
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nominal Setoran (Rp)
            </label>
            <input
              type="number"
              required
              min="0"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {amount > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                {formatRupiah(amount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="Setoran Tunai">Setoran Tunai</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Bukti transfer / keterangan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {entry?.isPaid ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Setoran</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
