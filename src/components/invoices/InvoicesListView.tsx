import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { exportInvoicesToExcel } from '../../utils/exportExcel';
import { matchesFuzzyPersian } from '../../utils/text';
import { InvoiceViewModal } from './InvoiceViewModal';
import { Receipt, Search, FileSpreadsheet, Eye, CreditCard, Banknote } from 'lucide-react';

export const InvoicesListView: React.FC = () => {
  const { invoices } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'pos'>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchPay = paymentFilter === 'all' || inv.payment_method === paymentFilter;
    if (!matchPay) return false;
    if (!searchQuery.trim()) return true;

    const matchNumber = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCustomer = inv.customer_name ? matchesFuzzyPersian(inv.customer_name, searchQuery) : false;
    const matchUser = inv.user_name ? matchesFuzzyPersian(inv.user_name, searchQuery) : false;
    const matchItems = inv.items.some((it) => matchesFuzzyPersian(it.service_title, searchQuery));

    return matchNumber || matchCustomer || matchUser || matchItems;
  });

  const totalSum = filteredInvoices.reduce((acc, i) => acc + i.final_amount, 0);

  return (
    <div className="space-y-4 text-right max-w-7xl mx-auto">
      {/* هدر */}
      <div className="bg-white dark:bg-[#202024] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            آرشیو فاکتورها و دریافتی‌های کافی‌نت
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5">
            مجموع {filteredInvoices.length} فاکتور ثبت شده با حجم ریالی {formatToman(totalSum)}
          </p>
        </div>

        <button
          onClick={() => exportInvoicesToExcel(filteredInvoices)}
          className="px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          خروجی اکسل فاکتورها (.xlsx)
        </button>
      </div>

      {/* ابزار فیلتر و جستجوی چندبعدی */}
      <div className="bg-white dark:bg-[#202024] p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری، شماره فاکتور، نوع خدمت یا متصدی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'همه فاکتورها' },
            { id: 'pos', label: 'کارت‌خوان (POS)' },
            { id: 'cash', label: 'نقدی' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPaymentFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                paymentFilter === btn.id
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* جدول فاکتورها */}
      <div className="bg-white dark:bg-[#202024] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 font-bold">
              <tr>
                <th className="p-3.5">شماره فاکتور</th>
                <th className="p-3.5">تاریخ و ساعت</th>
                <th className="p-3.5">مشتری</th>
                <th className="p-3.5">شرح خدمات ارائه شده</th>
                <th className="p-3.5">مبلغ پرداختی</th>
                <th className="p-3.5">روش پرداخت</th>
                <th className="p-3.5">متصدی</th>
                <th className="p-3.5 text-center">مشاهده / چاپ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">
                    فاکتوری با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3.5 font-black text-slate-800 dark:text-slate-200 font-mono">
                      {inv.invoice_number}
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-zinc-400 font-mono">
                      {formatJalaliDateTime(inv.created_at)}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">
                      {inv.customer_name || 'مشتری عمومی'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                      {inv.items.map((i) => i.service_title).join('، ')}
                    </td>
                    <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatToman(inv.final_amount)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold shadow-2xs ${
                          inv.payment_method === 'pos'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40'
                        }`}
                      >
                        {inv.payment_method === 'pos' ? '💳 کارت‌خوان' : '💵 نقدی'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-zinc-400 font-medium">{inv.user_name}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                        title="مشاهده و چاپ فاکتور"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoiceId && (
        <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      )}
    </div>
  );
};
