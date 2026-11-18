import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { matchesFuzzyPersian } from '../../utils/text';
import { Invoice } from '../../types';
import {
  BookOpen,
  Search,
  CheckCircle2,
  CreditCard,
  Banknote,
  Phone,
  Calendar,
  AlertCircle,
  Receipt,
  Eye,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { invoices, settleDebtInvoice } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [settlingInvoice, setSettlingInvoice] = useState<Invoice | null>(null);

  // تمام فاکتورهای نسیه (تسویه نشده)
  const creditInvoices = invoices.filter(
    (i) => i.payment_method === 'credit' && i.is_settled === false
  );

  // فاکتورهای نسیه که قبلاً تسویه شده‌اند
  const settledCreditInvoices = invoices.filter(
    (i) => i.payment_method === 'credit' && i.is_settled === true
  );

  // تجمیع بدهی‌ها بر اساس نام یا شماره تماس مشتری
  const debtorMap = new Map<
    string,
    { customer_name: string; customer_phone?: string; total_debt: number; invoices: Invoice[] }
  >();

  creditInvoices.forEach((inv) => {
    const key = (inv.customer_name || 'بدون نام').trim();
    const existing = debtorMap.get(key);
    if (existing) {
      existing.total_debt += inv.final_amount;
      existing.invoices.push(inv);
      if (!existing.customer_phone && inv.customer_phone) {
        existing.customer_phone = inv.customer_phone;
      }
    } else {
      debtorMap.set(key, {
        customer_name: key,
        customer_phone: inv.customer_phone,
        total_debt: inv.final_amount,
        invoices: [inv],
      });
    }
  });

  const debtorsList = Array.from(debtorMap.values()).filter((d) => {
    if (!searchQuery.trim()) return true;
    return (
      matchesFuzzyPersian(d.customer_name, searchQuery) ||
      (d.customer_phone && d.customer_phone.includes(searchQuery))
    );
  });

  const totalOutstandingDebt = creditInvoices.reduce((acc, i) => acc + i.final_amount, 0);
  const totalSettledDebt = settledCreditInvoices.reduce((acc, i) => acc + i.final_amount, 0);

  const handleSettle = (invoiceId: number, method: 'pos' | 'cash') => {
    settleDebtInvoice(invoiceId, method);
    setSettlingInvoice(null);
  };

  const handleSettleAllForCustomer = (invoicesToSettle: Invoice[], method: 'pos' | 'cash') => {
    invoicesToSettle.forEach((inv) => settleDebtInvoice(inv.id, method));
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-4 text-right max-w-7xl mx-auto pb-10">
      {/* هدر بخش حساب دفتری */}
      <div className="bg-white dark:bg-[#202024] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            حساب دفتری و دفترچه نسیه مشتریان دائم
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ثبت بدهی شرکت‌ها، مغازه‌داران و مشتریان معتبر و تسویه مبالغ معوقه
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">تعداد بدهکاران جاری:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black border border-amber-200 dark:border-amber-800/40">
            {debtorsList.length} نفر / شرکت
          </span>
        </div>
      </div>

      {/* کارت‌های خلاصه مالی نسیه */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* کل مطالبات معوقه */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 dark:from-[#202024] dark:to-[#262017] p-4.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">کل مطالبات معوقه (طلب مغازه)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatToman(totalOutstandingDebt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>{creditInvoices.length} فاکتور تسویه نشده</span>
            <span className="text-amber-600 font-bold">در انتظار وصول</span>
          </div>
        </div>

        {/* مبالغ تسویه شده تاکنون */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-[#202024] dark:to-[#172720] p-4.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">نسیه‌های وصول و تسویه شده</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatToman(totalSettledDebt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {settledCreditInvoices.length} فاکتور تسویه شده
          </div>
        </div>

        {/* میانگین مطالبات */}
        <div className="bg-white dark:bg-[#202024] p-4.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2">
            راهنمای حساب دفتری
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            هنگام صدور فاکتور در صفحه فروش، روش پرداخت را روی «نسیه / دفتری» بگذارید تا مبلغ فاکتور مستقیماً در این دفترچه ثبت شود.
          </p>
        </div>
      </div>

      {/* جستجو در لیست بدهکاران */}
      <div className="bg-white dark:bg-[#202024] p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری یا شماره تماس بدهکار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
          />
        </div>
      </div>

      {/* جدول مشتریان بدهکار */}
      <div className="bg-white dark:bg-[#202024] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 font-bold">
              <tr>
                <th className="p-3.5">نام مشتری / شرکت</th>
                <th className="p-3.5">شماره تماس</th>
                <th className="p-3.5 text-center">تعداد فاکتور</th>
                <th className="p-3.5">مبلغ کل بدهی</th>
                <th className="p-3.5">تاریخ آخرین فاکتور</th>
                <th className="p-3.5 text-center">عملیات تسویه و ریزحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {debtorsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                    خوشبختانه در حال حاضر هیچ بدهی معوقه یا حساب دفتری ثبت نشده است.
                  </td>
                </tr>
              ) : (
                debtorsList.map((debtor, idx) => {
                  const lastInv = debtor.invoices[0];
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3.5 font-black text-slate-800 dark:text-white">
                        {debtor.customer_name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-zinc-400">
                        {debtor.customer_phone || '---'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold font-mono">
                          {debtor.invoices.length}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-rose-600 dark:text-rose-400 text-sm">
                        {formatToman(debtor.total_debt)}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                        {lastInv ? formatJalaliDateTime(lastInv.created_at) : '---'}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(debtor.customer_name)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ریز فاکتورها</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال مشاهده ریز فاکتورها و تسویه کل بدهی مشتری */}
      {selectedCustomer && debtorMap.has(selectedCustomer) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#202024] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    ریز حساب دفتری: {selectedCustomer}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مانده کل بدهی: <strong className="text-rose-600 font-black">{formatToman(debtorMap.get(selectedCustomer)!.total_debt)}</strong>
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* لیست تک‌تک فاکتورهای نسیه مشتری */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
              {debtorMap.get(selectedCustomer)!.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="font-mono text-blue-600 font-black">{inv.invoice_number}</span>
                      <span>({inv.items.map((i) => i.service_title).join('، ')})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatJalaliDateTime(inv.created_at)} | متصدی: {inv.user_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                      {formatToman(inv.final_amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSettlingInvoice(inv)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs"
                    >
                      تسویه این فاکتور
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* تسویه یکجای تمام فاکتورهای این مشتری */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                  تسویه یکجای تمام حساب ({formatToman(debtorMap.get(selectedCustomer)!.total_debt)})
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">
                  روش دریافت وجه را انتخاب کنید:
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSettleAllForCustomer(debtorMap.get(selectedCustomer)!.invoices, 'pos')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  تسویه با پوز (کارتخوان)
                </button>
                <button
                  type="button"
                  onClick={() => handleSettleAllForCustomer(debtorMap.get(selectedCustomer)!.invoices, 'cash')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  تسویه نقدی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال کوچک تسویه یک فاکتور خاص */}
      {settlingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#202024] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-5 text-right space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-white">
              تسویه فاکتور {settlingInvoice.invoice_number} ({formatToman(settlingInvoice.final_amount)})
            </h4>
            <p className="text-[11px] text-slate-400">
              مشتری مبلغ را چگونه پرداخت نمود؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettle(settlingInvoice.id, 'pos')}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <CreditCard className="w-4 h-4" />
                کارت‌خوان
              </button>
              <button
                type="button"
                onClick={() => handleSettle(settlingInvoice.id, 'cash')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Banknote className="w-4 h-4" />
                نقدی
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSettlingInvoice(null)}
              className="w-full py-1.5 border border-slate-200 dark:border-zinc-700 text-slate-500 rounded-xl text-xs font-bold"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
