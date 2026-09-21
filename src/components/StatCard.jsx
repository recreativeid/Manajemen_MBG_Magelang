import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, badge }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
        <span className="truncate mr-2">{subtext}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
