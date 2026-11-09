import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { exportExpensesToExcel } from '../../utils/exportExcel';
import { ExpenseModal } from '../dashboard/ExpenseModal';
import { ArrowDownCircle, Plus, FileSpreadsheet, Search } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses } = useData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.user_name && e.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExpenseSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-4 text-right">
      {/* هدر */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-rose-600" />
            دفتر هزینه‌های جاری و خرید ملزومات مغازه
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مجموع {filteredExpenses.length} قلم هزینه با حجم ریالی {formatToman(totalExpenseSum)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExpensesToExcel(filteredExpenses)}
            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            خروجی اکسل هزینه‌ها (.xlsx)
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            ثبت هزینه جدید
          </button>
        </div>
      </div>

      {/* جستجو */}
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی عنوان هزینه یا توضیحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>
      </div>

      {/* جدول هزینه‌ها */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">ردیف</th>
                <th className="p-3">عنوان هزینه</th>
                <th className="p-3">مبلغ پرداختی</th>
                <th className="p-3">روش پرداخت</th>
                <th className="p-3">متصدی ثبت‌کننده</th>
                <th className="p-3">توضیحات تکمیلی</th>
                <th className="p-3">تاریخ و ساعت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    هزینه‌ای ثبت نشده است.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750 transition-colors">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{exp.title}</td>
                    <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">
                      {formatToman(exp.amount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-slate-300">
                        {exp.payment_method === 'cash' ? 'صندوق نقدی' : 'کارتخوان / بانک'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{exp.user_name || '-'}</td>
                    <td className="p-3 text-slate-500">{exp.description || '-'}</td>
                    <td className="p-3 text-slate-400">{formatJalaliDateTime(exp.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
};
