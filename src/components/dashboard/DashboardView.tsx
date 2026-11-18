import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliTime } from '../../utils/jalali';
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
  ShieldCheck,
  Zap,
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
      setShiftDuration(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
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
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* ================= نوار وضعیت شیفت متصدی و حاضرین ================= */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#202024] dark:via-[#1e1e22] dark:to-[#202024] rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-zinc-800 flex flex-col lg:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 flex-1 w-full lg:w-auto">
          <div
            className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
              currentShift
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 ring-4 ring-emerald-500/20'
                : 'bg-slate-300 dark:bg-zinc-700'
            }`}
          >
            {currentShift && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-black text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
              <span>وضعیت شیفت کاری:</span>
              {currentShift ? (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    شروع: {formatJalaliTime(currentShift.start_time)}
                  </span>
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 bg-slate-900 text-emerald-400 dark:bg-black/60 dark:text-emerald-400 rounded-lg tracking-wider border border-emerald-500/30">
                    {shiftDuration}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-0.5 rounded-full font-bold">
                  شیفت هنوز آغاز نشده است
                </span>
              )}
            </div>

            {/* پرسنل حاضر در شیفت */}
            <div className="text-xs text-slate-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-zinc-300">پرسنل حاضر در مغازه:</span>
              {currentShift ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(currentShift.workers && currentShift.workers.length > 0
                    ? currentShift.workers
                    : [{ user_id: currentShift.user_id, user_name: currentShift.user_name }]
                  ).map((worker) => (
                    <span
                      key={worker.user_id}
                      className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-1 text-[11px] shadow-2xs"
                    >
                      <Users className="w-3 h-3 text-blue-500" />
                      {worker.user_name || `کاربر ${worker.user_id}`}
                      {worker.user_id === currentShift.user_id && (
                        <span className="text-[9px] bg-blue-200/60 dark:bg-blue-800/50 px-1 py-0.2 rounded text-blue-800 dark:text-blue-200">مسئول</span>
                      )}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowManageWorkersModal(true)}
                    className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-700/60 transition-all flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    مدیریت همکاران حاضر
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              شروع شیفت کاری
            </button>
          ) : (
            <button
              onClick={handleOpenEndShift}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              پایان و تحویل شیفت کاری
            </button>
          )}
        </div>
      </div>

      {/* ================= بنر کارهای در دست اقدام (Handover) ================= */}
      {activePendingOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 dark:border-amber-600/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                {activePendingOrders.length} سفارش پیگیری‌دار و معلق در انتظار اقدام
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5 font-medium">
                مدارک و سفارشات مشتریان که از شیفت‌های قبل نیاز به انجام، پیگیری یا تحویل دارند.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pending')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            مشاهده میز کار سفارشات
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= کارت‌های آمار زنده صندوق امروز ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* کل دخل امروز */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-[#202024] dark:to-[#1b2234] rounded-2xl p-4.5 border border-slate-200/80 dark:border-blue-900/40 shadow-xs hover:border-blue-500 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2.5">
            <span className="text-xs font-bold">مجموع کل دخل امروز</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {formatToman(todayTotalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
            <span className="font-semibold text-slate-600 dark:text-zinc-300">{todayInvoices.length} فاکتور ثبت شده</span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
              مجموع دریافتی
            </span>
          </div>
        </div>

        {/* کارتخوان POS */}
        <div className="bg-gradient-to-br from-white to-indigo-50/30 dark:from-[#202024] dark:to-[#1f1e33] rounded-2xl p-4.5 border border-slate-200/80 dark:border-indigo-900/40 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2.5">
            <span className="text-xs font-bold">دریافتی کارت‌خوان (POS)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatToman(todayPosIncome)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
              <div style={{ width: `${posPercentage}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"></div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center justify-between font-semibold">
              <span>سهم کارت‌خوان</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{posPercentage}٪</span>
            </div>
          </div>
        </div>

        {/* نقد صندوق */}
        <div className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-[#202024] dark:to-[#172722] rounded-2xl p-4.5 border border-slate-200/80 dark:border-emerald-900/40 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2.5">
            <span className="text-xs font-bold">مانده نقد صندوق امروز</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatToman(todayNetCashBalance)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span>ورودی: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatToman(todayCashIncome)}</strong></span>
            <span>خروجی: <strong className="text-rose-500 font-bold">{formatToman(todayCashExpenses)}</strong></span>
          </div>
        </div>

        {/* هزینه‌های امروز مغازه */}
        <div className="bg-gradient-to-br from-white to-rose-50/30 dark:from-[#202024] dark:to-[#2b181d] rounded-2xl p-4.5 border border-slate-200/80 dark:border-rose-900/40 shadow-xs hover:border-rose-500 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2.5">
            <span className="text-xs font-bold">هزینه‌های امروز مغازه</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatToman(todayTotalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-400 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-zinc-300">{todayExpenses.length} قلم هزینه ثبت شده</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
              کاغذ، تونر و پذیرایی
            </span>
          </div>
        </div>
      </div>

      {/* ================= دکمه‌های اقدام سریع (Quick Actions) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setIsQuickSaleOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-emerald-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-black flex items-center gap-1.5">
              <span>ثبت فاکتور و دریافتی جدید</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono font-bold">F1</span>
            </div>
            <div className="text-xs text-emerald-100 mt-1">
              پرینت، ثبت‌نام اینترنتی، اسکن و خدمات
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
            <PlusCircle className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setIsPrintCalcOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-blue-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-black flex items-center gap-1.5">
              <span>محاسبه‌گر سریع پرینت و کپی</span>
            </div>
            <div className="text-xs text-blue-100 mt-1">
              محاسبه آنی بر اساس تعرفه مصوب و انتقال به فاکتور
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
            <Calculator className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setIsExpenseOpen(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-between group active:scale-[0.98] transition-all border border-rose-500/30"
        >
          <div className="text-right">
            <div className="text-sm font-black flex items-center gap-1.5">
              <span>ثبت هزینه مغازه</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono font-bold">F4</span>
            </div>
            <div className="text-xs text-rose-100 mt-1">
              خرید کاغذ، شارژ کارتریج، قبوض و تنقلات
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* ================= جدول تراکنش‌های امروز ================= */}
      <div className="bg-white dark:bg-[#202024] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/60 dark:bg-zinc-850">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white">
              تراکنش‌ها و فاکتورهای امروز کافی‌نت ({todayInvoices.length} فاکتور)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-extrabold flex items-center gap-1 transition-colors"
          >
            مشاهده آرشیو کامل
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {todayInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2 opacity-50" />
              امروز هنوز تراکنشی ثبت نشده است؛ با زدن دکمه «ثبت فاکتور جدید» اولین دریافتی را وارد کنید.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800 font-bold">
                <tr>
                  <th className="p-3.5">شماره فاکتور</th>
                  <th className="p-3.5">ساعت</th>
                  <th className="p-3.5">مشتری</th>
                  <th className="p-3.5">خدمات ارائه شده</th>
                  <th className="p-3.5">مبلغ پرداختی</th>
                  <th className="p-3.5">روش پرداخت</th>
                  <th className="p-3.5">متصدی</th>
                  <th className="p-3.5 text-center">مشاهده / چاپ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {todayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {inv.invoice_number}
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-zinc-400 font-mono">{formatJalaliTime(inv.created_at)}</td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= مودال انتخاب همکاران در شروع شیفت ================= */}
      {showStartShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#202024] rounded-3xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              شروع شیفت کاری و تعیین همکاران حاضر
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              شما ({currentUser?.full_name}) به عنوان مسئول شیفت ثبت می‌شوید. اگر همکاران دیگری نیز همزمان با شما در مغازه فعالیت می‌کنند، آن‌ها را انتخاب نمایید:
            </p>

            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {currentUser?.full_name}
                </span>
                <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full font-bold">
                  مسئول شیفت (شما)
                </span>
              </div>

              {activeOtherUsers.map((userItem) => {
                const isSelected = selectedWorkerIdsForStart.includes(userItem.id);
                return (
                  <label
                    key={userItem.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
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
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      {userItem.full_name} ({userItem.role === 'admin' ? 'مدیریت' : 'اپراتور'})
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-100/60 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
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
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 active:scale-95"
              >
                تایید و آغاز شیفت کاری
              </button>
              <button
                type="button"
                onClick={() => setShowStartShiftModal(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال مدیریت همکاران حاضر در شیفت در حال اجرا ================= */}
      {showManageWorkersModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#202024] rounded-3xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              مدیریت همکاران حاضر در شیفت جاری
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              با کلیک روی نام هر همکار، حضور یا عدم حضور وی را در شیفت فعال تغییر دهید. ساعت کارکرد نهایی در زمان پایان شیفت ثبت خواهد شد.
            </p>

            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
              {users
                .filter((u) => u.is_active && !u.is_deleted)
                .map((u) => {
                  const currentWorkers = currentShift.workers || [
                    { user_id: currentShift.user_id, user_name: currentShift.user_name || '' },
                  ];
                  const isPresent = currentWorkers.some((w) => w.user_id === u.id);
                  const isShiftOwner = u.id === currentShift.user_id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        isPresent
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`}></span>
                        <span>{u.full_name}</span>
                        {isShiftOwner && (
                          <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                            مسئول شیفت
                          </span>
                        )}
                      </div>

                      {isShiftOwner ? (
                        <span className="text-[10px] text-slate-400">ثابت</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleWorkerInActiveShift(u)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all ${
                            isPresent
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                          }`}
                        >
                          {isPresent ? 'خروج از شیفت' : '+ افزودن به شیفت'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setShowManageWorkersModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/25 active:scale-95"
            >
              بستن و ذخیره تغییرات
            </button>
          </div>
        </div>
      )}

      {/* ================= مودال پایان شیفت و ثبت ساعت کارکرد همکاران ================= */}
      {showEndShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#202024] rounded-3xl shadow-2xl p-6 text-right border border-slate-200 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Square className="w-4 h-4 text-rose-600" />
              پایان و تحویل شیفت کاری
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              مدت زمان کلی شیفت محاسبه شده است. در صورت نیاز می‌توانید ساعات واقعی حضور هر یک از همکاران حاضر را ویرایش فرمایید:
            </p>

            {/* لیست همکاران و فیلد ساعت کارکرد */}
            <div className="space-y-2.5 mb-4 max-h-52 overflow-y-auto pr-1">
              {endShiftWorkers.map((w, idx) => (
                <div
                  key={w.user_id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{w.user_name}</span>
                    {w.user_id === currentShift.user_id && (
                      <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                        مسئول
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      value={w.hours}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...endShiftWorkers];
                        updated[idx].hours = val;
                        setEndShiftWorkers(updated);
                      }}
                      className="w-20 h-9 px-2 text-center rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-black text-xs font-mono"
                    />
                    <span className="text-slate-500 font-semibold text-[11px]">ساعت</span>
                  </div>
                </div>
              ))}
            </div>

            {/* یادداشت تحویل شیفت */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                یادداشت یا توضیحات تحویل به شیفت بعدی:
              </label>
              <textarea
                rows={2}
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                placeholder="مثلاً: مبلغ ۲۰۰ هزار تومان پول خرد در کشو است، سفارش پرینت مشتری آقای حسینی آماده است..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmEndShift}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/25 active:scale-95"
              >
                تایید نهایی و بستن شیفت
              </button>
              <button
                type="button"
                onClick={() => setShowEndShiftModal(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800"
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
        onAddToInvoice={(title, quantity, unitPrice) => {
          setIsPrintCalcOpen(false);
          setIsQuickSaleOpen(true);
        }}
      />

      <ExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />

      {selectedInvoiceId && (
        <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      )}
    </div>
  );
};
