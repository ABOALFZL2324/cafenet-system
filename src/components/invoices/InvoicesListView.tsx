import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { exportInvoicesToExcel } from '../../utils/exportExcel';
import { InvoiceViewModal } from './InvoiceViewModal';
import { Receipt, Search, FileSpreadsheet, Eye } from 'lucide-react';

export const InvoicesListView: React.FC = () => {
  const { invoices } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'pos'>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchPay = paymentFilter === 'all' || inv.payment_method === paymentFilter;
    const matchQuery =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.user_name && inv.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchPay && matchQuery;
  });

  const totalSum = filteredInvoices.reduce((acc, i) => acc + i.final_amount, 0);

  return (
    <div className="space-y-4 text-right">
      {/* هدر */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            آرشیو فاکتورها و دریافتی‌های کافی‌نت
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مجموع {filteredInvoices.length} فاکتور ثبت شده با حجم ریالی {formatToman(totalSum)}
          </p>
        </div>

        <button
          onClick={() => exportInvoicesToExcel(filteredInvoices)}
          className="px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          خروجی اکسل فاکتورها (.xlsx)
        </button>
      </div>

      {/* ابزار فیلتر */}
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی شماره فاکتور، نام مشتری یا متصدی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'همه تراکنش‌ها' },
            { id: 'pos', label: 'کارت‌خوان (POS)' },
            { id: 'cash', label: 'نقدی' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setPaymentFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                paymentFilter === btn.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* جدول فاکتورها */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">شماره فاکتور</th>
                <th className="p-3">تاریخ و ساعت</th>
                <th className="p-3">مشتری</th>
                <th className="p-3">شرح خدمات</th>
                <th className="p-3">مبلغ پرداختی</th>
                <th className="p-3">روش پرداخت</th>
                <th className="p-3">متصدی</th>
                <th className="p-3 text-center">مشاهده / چاپ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    فاکتوری با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750 transition-colors">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {inv.invoice_number}
                    </td>
                    <td className="p-3 text-slate-500">{formatJalaliDateTime(inv.created_at)}</td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                      {inv.customer_name || 'عمومی'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {inv.items.map((i) => `${i.service_title} (${i.quantity})`).join('، ')}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatToman(inv.final_amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          inv.payment_method === 'pos'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {inv.payment_method === 'pos' ? 'کارتخوان' : 'نقدی'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{inv.user_name || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors"
                        title="مشاهده فاکتور و چاپ حرارتی/A5"
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

      <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  );
};
