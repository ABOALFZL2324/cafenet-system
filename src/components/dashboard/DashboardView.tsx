import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliTime, formatJalaliDateTime } from '../../utils/jalali';
import { QuickSaleModal } from './QuickSaleModal';
import { PrintCalculatorModal } from './PrintCalculatorModal';
import { ExpenseModal } from './ExpenseModal';
import { InvoiceViewModal } from '../invoices/InvoiceViewModal';
import {
  Play,
  Square,
  CreditCard,
  Banknote,
  TrendingUp,
  ArrowDownCircle,
  PlusCircle,
  Calculator,
  ClipboardList,
  Receipt,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { currentUser, currentShift, startShift, endShift } = useAuth();
  const { invoices, expenses, pendingOrders } = useData();

  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isPrintCalcOpen, setIsPrintCalcOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);

  // تراکنش‌های امروز (از ساعت ۰۰:۰۰ تا الان بر اساس تاریخ محلی)
  const todayStr = new Date().toDateString();
  const todayInvoices = invoices.filter((i) => new Date(i.created_at).toDateString() === todayStr);
  const todayExpenses = expenses.filter((e) => new Date(e.created_at).toDateString() === todayStr);

  // آمار دقیق واقعی امروز (قانون قطعیت داده‌ها)
  const todayPosIncome = todayInvoices
    .filter((i) => i.payment_method === 'pos')
    .reduce((acc, i) => acc + i.final_amount, 0);

  const todayCashIncome = todayInvoices
    .filter((i) => i.payment_method === 'cash')
    .reduce((acc, i) => acc + i.final_amount, 0);

  const todayTotalIncome = todayPosIncome + todayCashIncome;

  const todayCashExpenses = todayExpenses
    .filter((e) => e.payment_method === 'cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const todayTotalExpenses = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // مانده نقدی دخل امروز
  const todayNetCashBalance = todayCashIncome - todayCashExpenses;

  // کارهای در دست اقدام
  const activePendingOrders = pendingOrders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress'
  );

  const handlePrintCalcApply = (title: string, qty: number, price: number) => {
    setIsQuickSaleOpen(true);
  };

  const handleConfirmEndShift = () => {
    endShift(handoverNote.trim() || undefined);
    setHandoverNote('');
    setShowEndShiftModal(false);
  };

  return (
    <div className="space-y-5">
      {/* ================= نوار وضعیت شیفت ================= */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              currentShift ? 'bg-emerald-500 animate-ping' : 'bg-slate-300 dark:bg-zinc-600'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              وضعیت شیفت کاری:
              {currentShift ? (
                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-extrabold">
                  در حال اجرا (از ساعت {formatJalaliTime(currentShift.start_time)})
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full font-medium">
                  شیفت بسته است
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              متصدی جاری: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.full_name}</strong>
            </div>
          </div>
        </div>

        {/* دکمه‌های کنترل شیفت */}
        <div>
          {!currentShift ? (
            <button
              onClick={startShift}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              شروع شیفت کاری من
            </button>
          ) : (
            <button
              onClick={() => setShowEndShiftModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              پایان و تحویل شیفت
            </button>
          )}
        </div>
      </div>

      {/* ================= بنر کارهای در دست اقدام (Handover) ================= */}
      {activePendingOrders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {activePendingOrders.length} سفارش معلق و پیگیری‌دار در انتظار اقدام
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                سفارشات مشتریان از شیفت‌های قبل که هنوز تکمیل یا تحویل نشده‌اند.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pending')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
          >
            مشاهده سفارشات &larr;
          </button>
        </div>
      )}

      {/* ================= کارت‌های آمار مالی امروز ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* کل دخل امروز */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">مجموع دخل امروز</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100">
            {formatToman(todayTotalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {todayInvoices.length} تراکنش ثبت شده
          </div>
        </div>

        {/* کارتخوان */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">دریافتی کارت‌خوان (POS)</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
            {formatToman(todayPosIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">مستقیم به حساب مغازه</div>
        </div>

        {/* نقد صندوق */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">مانده نقدی صندوق امروز</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatToman(todayNetCashBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ورودی: {formatToman(todayCashIncome)} | خروجی: {formatToman(todayCashExpenses)}
          </div>
        </div>

        {/* هزینه‌های امروز */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">هزینه‌های امروز مغازه</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">
            {formatToman(todayTotalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {todayExpenses.length} قلم هزینه ثبت شده
          </div>
        </div>
      </div>

      {/* ================= دکمه‌های دسترسی سریع عملیاتی ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setIsQuickSaleOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="text-right">
            <div className="text-sm font-bold">ثبت فاکتور و دریافتی جدید</div>
            <div className="text-[11px] text-emerald-100 mt-0.5">
              پرینت، ثبت‌نام، اسکن و خدمات چندگانه
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setIsPrintCalcOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="text-right">
            <div className="text-sm font-bold">محاسبه‌گر سریع پرینت / کپی</div>
            <div className="text-[11px] text-blue-100 mt-0.5">
              محاسبه آنی قیمت برگه‌ها و انتقال به فاکتور
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setIsExpenseOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/20 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="text-right">
            <div className="text-sm font-bold">ثبت هزینه مغازه</div>
            <div className="text-[11px] text-rose-100 mt-0.5">
              خرید کاغذ، تونر، قبوض و ملزومات جاری
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* ================= جدول تراکنش‌های امروز ================= */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              تراکنش‌ها و فاکتورهای امروز کافی‌نت ({todayInvoices.length} فاکتور)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            مشاهده آرشیو کامل &larr;
          </button>
        </div>

        <div className="overflow-x-auto">
          {todayInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              امروز هنوز تراکنشی ثبت نشده است؛ با زدن دکمه «ثبت فاکتور جدید» اولین دریافتی را وارد کنید.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
                <tr>
                  <th className="p-3">شماره فاکتور</th>
                  <th className="p-3">ساعت</th>
                  <th className="p-3">مشتری</th>
                  <th className="p-3">خدمات ارائه شده</th>
                  <th className="p-3">مبلغ پرداختی</th>
                  <th className="p-3">روش پرداخت</th>
                  <th className="p-3">متصدی</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                {todayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750 transition-colors">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.invoice_number}
                    </td>
                    <td className="p-3 text-slate-500">{formatJalaliTime(inv.created_at)}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {inv.customer_name || 'مشتری عمومی'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {inv.items.map((i) => i.service_title).join('، ')}
                    </td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
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
                        {inv.payment_method === 'pos' ? 'کارت‌خوان' : 'نقدی'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{inv.user_name}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors"
                        title="مشاهده و چاپ فاکتور"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= مودال تایید پایان شیفت ================= */}
      {showEndShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              ثبت پایان و تحویل شیفت کاری
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              با زدن پایان شیفت، ساعت خروج شما ثبت می‌شود و گزارش کارکرد این شیفت بسته خواهد شد.
            </p>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              یادداشت برای همکار شیفت بعد یا مدیر (اختیاری):
            </label>
            <textarea
              rows={3}
              placeholder="مثلا: کاغذ در کشو دوم شارژ شد، پرینتر سالم است..."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmEndShift}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                تایید و بستن شیفت
              </button>
              <button
                type="button"
                onClick={() => setShowEndShiftModal(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال‌های عملیاتی */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onOpenPrintCalc={() => {
          setIsQuickSaleOpen(false);
          setIsPrintCalcOpen(true);
        }}
        onViewInvoice={(id) => setSelectedInvoiceId(id)}
      />

      <PrintCalculatorModal
        isOpen={isPrintCalcOpen}
        onClose={() => setIsPrintCalcOpen(false)}
        onAddToInvoice={handlePrintCalcApply}
      />

      <ExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />

      <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  );
};
