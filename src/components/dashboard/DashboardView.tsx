import React, { useState, useEffect } from 'react';
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
  Receipt,
  AlertCircle,
  Eye,
  Clock,
  Sparkles,
  ArrowUpRight,
  Users,
  UserPlus,
  Trash2,
  Check,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { currentUser, currentShift, startShift, endShift, updateShiftWorkers } = useAuth();
  const { invoices, expenses, pendingOrders, users } = useData();

  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isPrintCalcOpen, setIsPrintCalcOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showManageWorkersModal, setShowManageWorkersModal] = useState(false);

  // کارگران انتخاب‌شده برای شروع شیفت
  const [selectedWorkerIdsForStart, setSelectedWorkerIdsForStart] = useState<number[]>([]);

  // کارگران حاضر و ساعت کارکرد برای مودال پایان شیفت
  const [endShiftWorkers, setEndShiftWorkers] = useState<
    { user_id: number; user_name: string; hours: number }[]
  >([]);

  // تایمر زنده شیفت فعال
  const [shiftDuration, setShiftDuration] = useState<string>('');

  useEffect(() => {
    if (!currentShift) {
      setShiftDuration('');
      return;
    }

    const updateTimer = () => {
      const diffMs = Date.now() - new Date(currentShift.start_time).getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setShiftDuration(`${hrs} ساعت و ${mins} دقیقه و ${secs} ثانیه`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentShift]);

  // تراکنش‌های امروز
  const todayStr = new Date().toDateString();
  const todayInvoices = invoices.filter((i) => new Date(i.created_at).toDateString() === todayStr);
  const todayExpenses = expenses.filter((e) => new Date(e.created_at).toDateString() === todayStr);

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
  const todayNetCashBalance = todayCashIncome - todayCashExpenses;

  // درصد نسبت کارتخوان و نقدی
  const posPercentage = todayTotalIncome > 0 ? Math.round((todayPosIncome / todayTotalIncome) * 100) : 0;
  const cashPercentage = todayTotalIncome > 0 ? 100 - posPercentage : 0;

  // کارهای در دست اقدام
  const activePendingOrders = pendingOrders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress'
  );

  // سایر کاربران فعال سیستم جهت حضور همزمان
  const activeOtherUsers = users.filter(
    (u) => u.is_active && !u.is_deleted && u.id !== currentUser?.id
  );

  const handleOpenStartShift = () => {
    if (activeOtherUsers.length > 0) {
      setSelectedWorkerIdsForStart([]);
      setShowStartShiftModal(true);
    } else {
      startShift();
    }
  };

  const handleConfirmStartShift = () => {
    startShift(selectedWorkerIdsForStart);
    setShowStartShiftModal(false);
  };

  const handleOpenEndShift = () => {
    if (!currentShift) return;
    const diffMs = Date.now() - new Date(currentShift.start_time).getTime();
    const durationHours = Math.max(0.1, Number((diffMs / (1000 * 3600)).toFixed(2)));

    const workersList =
      currentShift.workers && currentShift.workers.length > 0
        ? currentShift.workers.map((w) => ({
            user_id: w.user_id,
            user_name:
              w.user_name ||
              users.find((u) => u.id === w.user_id)?.full_name ||
              `کاربر ${w.user_id}`,
            hours: w.hours !== undefined ? w.hours : durationHours,
          }))
        : [
            {
              user_id: currentShift.user_id,
              user_name: currentShift.user_name || currentUser?.full_name || 'متصدی شیفت',
              hours: durationHours,
            },
          ];

    setEndShiftWorkers(workersList);
    setShowEndShiftModal(true);
  };

  const handleConfirmEndShift = () => {
    endShift(handoverNote.trim() || undefined, endShiftWorkers);
    setHandoverNote('');
    setShowEndShiftModal(false);
  };

  // افزودن یا حذف کارگر در شیفت فعال فعلی
  const handleToggleWorkerInActiveShift = (userItem: { id: number; full_name: string }) => {
    if (!currentShift) return;
    const currentWorkers = currentShift.workers || [
      { user_id: currentShift.user_id, user_name: currentShift.user_name || '' },
    ];
    const exists = currentWorkers.some((w) => w.user_id === userItem.id);

    let updatedWorkers;
    if (exists) {
      // اگر کاربر اصلی شیفت است اجازه حذف داده نشود
      if (userItem.id === currentShift.user_id) {
        alert('مسئول بازکننده شیفت نمی‌تواند از شیفت حذف شود.');
        return;
      }
      updatedWorkers = currentWorkers.filter((w) => w.user_id !== userItem.id);
    } else {
      updatedWorkers = [...currentWorkers, { user_id: userItem.id, user_name: userItem.full_name }];
    }
    updateShiftWorkers(updatedWorkers);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ================= نوار وضعیت شیفت متصدی و حاضرین ================= */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-zinc-700/80 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 flex-1 w-full lg:w-auto">
          <div
            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              currentShift ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'
            }`}
          />
          <div className="space-y-1">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2">
              <span>وضعیت شیفت کاری:</span>
              {currentShift ? (
                <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  شروع: {formatJalaliTime(currentShift.start_time)} ({shiftDuration})
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-100 dark:bg-zinc-700 px-2.5 py-0.5 rounded-full font-medium">
                  شیفت هنوز آغاز نشده است
                </span>
              )}
            </div>

            {/* نمایش کارگران و حاضرین همزمان در شیفت */}
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
              <span>پرسنل حاضر در مغازه:</span>
              {currentShift ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(currentShift.workers && currentShift.workers.length > 0
                    ? currentShift.workers
                    : [{ user_id: currentShift.user_id, user_name: currentShift.user_name }]
                  ).map((worker) => (
                    <span
                      key={worker.user_id}
                      className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1"
                    >
                      <Users className="w-3 h-3 text-blue-500" />
                      {worker.user_name || `کاربر ${worker.user_id}`}
                      {worker.user_id === currentShift.user_id && (
                        <span className="text-[9px] opacity-75">(مسئول)</span>
                      )}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowManageWorkersModal(true)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-700 rounded-md"
                  >
                    + مدیریت همکاران حاضر
                  </button>
                </div>
              ) : (
                <strong className="text-slate-700 dark:text-slate-200">{currentUser?.full_name}</strong>
              )}
            </div>
          </div>
        </div>

        {/* دکمه شروع یا پایان شیفت */}
        <div className="shrink-0 flex items-center gap-2">
          {!currentShift ? (
            <button
              onClick={handleOpenStartShift}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              شروع شیفت کاری
            </button>
          ) : (
            <button
              onClick={handleOpenEndShift}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              پایان و تحویل شیفت کاری
            </button>
          )}
        </div>
      </div>

      {/* ================= بنر کارهای در دست اقدام (Handover) ================= */}
      {activePendingOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                {activePendingOrders.length} سفارش پیگیری‌دار و معلق در انتظار اقدام
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                مدارک و سفارشات مشتریان که از شیفت‌های قبل نیاز به انجام یا تحویل دارند.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pending')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1"
          >
            مشاهده میز کار سفارشات
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= کارت‌های آمار زنده صندوق امروز ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* کل دخل امروز */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">مجموع کل دخل امروز</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {formatToman(todayTotalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{todayInvoices.length} فاکتور ثبت شده</span>
            <span className="text-blue-600 font-semibold text-[10px]">مجموع دریافتی‌ها</span>
          </div>
        </div>

        {/* کارتخوان POS */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 shadow-sm hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">دریافتی کارت‌خوان (POS)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatToman(todayPosIncome)}
          </div>
          <div className="mt-2">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-700 overflow-hidden">
              <div style={{ width: `${posPercentage}%` }} className="h-full bg-indigo-600 rounded-full"></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 text-left" dir="ltr">
              {posPercentage}% of today
            </div>
          </div>
        </div>

        {/* نقد صندوق */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 shadow-sm hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">مانده نقد صندوق امروز</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatToman(todayNetCashBalance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ورودی: {formatToman(todayCashIncome)} | خروجی: {formatToman(todayCashExpenses)}
          </div>
        </div>

        {/* هزینه‌های امروز مغازه */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-700/80 shadow-sm hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">هزینه‌های امروز مغازه</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatToman(todayTotalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {todayExpenses.length} قلم هزینه ثبت شده
          </div>
        </div>
      </div>

      {/* ================= دکمه‌های اقدام سریع (Quick Actions) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={() => setIsQuickSaleOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-emerald-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-extrabold flex items-center gap-1.5">
              <span>ثبت فاکتور و دریافتی جدید</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">F1</span>
            </div>
            <div className="text-[11px] text-emerald-100 mt-0.5">
              پرینت، ثبت‌نام، اسکن و خدمات آزاد
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setIsPrintCalcOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-blue-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-extrabold flex items-center gap-1.5">
              <span>محاسبه‌گر سریع پرینت و کپی</span>
            </div>
            <div className="text-[11px] text-blue-100 mt-0.5">
              محاسبه آنی قیمت برگه‌ها و انتقال به فاکتور
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calculator className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setIsExpenseOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-rose-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-extrabold flex items-center gap-1.5">
              <span>ثبت هزینه مغازه</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">F4</span>
            </div>
            <div className="text-[11px] text-rose-100 mt-0.5">
              خرید کاغذ، تونر، قبوض و پذیرایی
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* ================= جدول تراکنش‌های امروز ================= */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-850">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              تراکنش‌ها و فاکتورهای امروز کافی‌نت ({todayInvoices.length} فاکتور)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
          >
            مشاهده آرشیو کامل
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {todayInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
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
                  <th className="p-3 text-center">مشاهده / چاپ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                {todayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-750 transition-colors">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {inv.invoice_number}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">{formatJalaliTime(inv.created_at)}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {inv.customer_name || 'مشتری عمومی'}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {inv.items.map((i) => i.service_title).join('، ')}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatToman(inv.final_amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          inv.payment_method === 'pos'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}
                      >
                        {inv.payment_method === 'pos' ? '💳 کارت‌خوان' : '💵 نقدی'}
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

      {/* ================= مودال انتخاب همکاران در شروع شیفت ================= */}
      {showStartShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              شروع شیفت کاری و تعیین همکاران حاضر
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              شما ({currentUser?.full_name}) به عنوان مسئول شیفت ثبت می‌شوید. اگر همکاران دیگری نیز همزمان با شما در مغازه فعالیت می‌کنند، آن‌ها را انتخاب نمایید:
            </p>

            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {currentUser?.full_name}
                </span>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  مسئول شیفت (شما)
                </span>
              </div>

              {activeOtherUsers.map((userItem) => {
                const isSelected = selectedWorkerIdsForStart.includes(userItem.id);
                return (
                  <label
                    key={userItem.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkerIdsForStart([...selectedWorkerIdsForStart, userItem.id]);
                          } else {
                            setSelectedWorkerIdsForStart(
                              selectedWorkerIdsForStart.filter((id) => id !== userItem.id)
                            );
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      {userItem.full_name} ({userItem.role === 'admin' ? 'مدیریت' : 'اپراتور'})
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                        همکار حاضر
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmStartShift}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                تایید و آغاز شیفت کاری
              </button>
              <button
                type="button"
                onClick={() => setShowStartShiftModal(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال مدیریت همکاران حاضر در حین شیفت فعال ================= */}
      {showManageWorkersModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              مدیریت همکاران حاضر در شیفت جاری
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              پرسنلی که هم‌اکنون در مغازه حضور دارند و در این شیفت فعالیت می‌کنند را علامت بزنید:
            </p>

            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
              {users
                .filter((u) => u.is_active && !u.is_deleted)
                .map((u) => {
                  const isPresent = (currentShift.workers || []).some((w) => w.user_id === u.id);
                  const isCreator = u.id === currentShift.user_id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isPresent
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold'
                          : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div>
                        <div>{u.full_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {isCreator ? 'مسئول بازکننده شیفت' : u.role === 'admin' ? 'مدیریت' : 'اپراتور'}
                        </div>
                      </div>

                      {isCreator ? (
                        <span className="text-[10px] text-emerald-600 font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                          حاضر دائمی
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleWorkerInActiveShift(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isPresent
                              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isPresent ? 'ثبت خروج' : 'ثبت ورود به شیفت'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setShowManageWorkersModal(false)}
              className="w-full py-2.5 bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* ================= مودال تایید پایان شیفت و ثبت ساعت کارکرد ================= */}
      {showEndShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-700 max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Square className="w-4 h-4 text-rose-600" />
              ثبت پایان شیفت کاری و ساعت کارکرد پرسنل
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              مدت زمان این شیفت به صورت خودکار محاسبه شده است. در صورت نیاز می‌توانید ساعت کارکرد دقیق هر یک از پرسنل حاضر را قبل از بستن شیفت تنظیم کنید:
            </p>

            {/* جدول ساعت کارکرد کارگران شیفت */}
            <div className="mb-4 bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-between">
                <span>لیست پرسنل و ساعت کارکرد این شیفت:</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  مجموع پرسنل: {endShiftWorkers.length} نفر
                </span>
              </div>

              <div className="space-y-2">
                {endShiftWorkers.map((worker, index) => (
                  <div
                    key={worker.user_id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                      {worker.user_name}
                      {worker.user_id === currentShift?.user_id && (
                        <span className="text-[10px] text-slate-400 mr-1.5">(مسئول شیفت)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-slate-500">ساعت کارکرد:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={worker.hours}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          const updated = [...endShiftWorkers];
                          updated[index].hours = val;
                          setEndShiftWorkers(updated);
                        }}
                        className="w-20 h-8 px-2 text-center rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 text-xs font-bold text-blue-700 dark:text-blue-300"
                      />
                      <span className="text-[11px] text-slate-400">ساعت</span>

                      {worker.user_id !== currentShift?.user_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEndShiftWorkers(
                              endShiftWorkers.filter((w) => w.user_id !== worker.user_id)
                            );
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-zinc-700 rounded transition-colors"
                          title="حذف از شیفت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* افزودن کارگر جا افتاده */}
              {users.some(
                (u) =>
                  u.is_active &&
                  !u.is_deleted &&
                  !endShiftWorkers.some((w) => w.user_id === u.id)
              ) && (
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">افزودن همکار دیگر به این شیفت:</span>
                  <select
                    onChange={(e) => {
                      const uId = parseInt(e.target.value);
                      if (!uId) return;
                      const userObj = users.find((u) => u.id === uId);
                      if (userObj) {
                        const defaultHrs = endShiftWorkers[0]?.hours || 1;
                        setEndShiftWorkers([
                          ...endShiftWorkers,
                          { user_id: userObj.id, user_name: userObj.full_name, hours: defaultHrs },
                        ]);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="h-8 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-semibold"
                  >
                    <option value="" disabled>
                      + انتخاب همکار...
                    </option>
                    {users
                      .filter(
                        (u) =>
                          u.is_active &&
                          !u.is_deleted &&
                          !endShiftWorkers.some((w) => w.user_id === u.id)
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              یادداشت تحویل به همکار شیفت بعد یا مدیر (اختیاری):
            </label>
            <textarea
              rows={2}
              placeholder="مثلا: کاغذ در کشو شارژ شد، فاکتورهای تحویل داده شده تسویه شدند..."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmEndShift}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
              >
                تایید و بستن رسمی شیفت
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
        onAddToInvoice={() => setIsQuickSaleOpen(true)}
      />

      <ExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />

      <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  );
};
