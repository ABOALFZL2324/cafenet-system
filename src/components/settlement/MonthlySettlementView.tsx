import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { toJalali, JALALI_MONTH_NAMES, formatJalaliDateTime } from '../../utils/jalali';
import { exportSettlementToExcel } from '../../utils/exportExcel';
import { SettlementModel, MonthlySettlementRecord } from '../../types';
import {
  BadgeDollarSign,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Layers,
  TrendingUp,
  ArrowDownCircle,
  UserCheck,
} from 'lucide-react';

export const MonthlySettlementView: React.FC = () => {
  const { currentUser } = useAuth();
  const { calculateMonthlySettlement, finalizeSettlement, settings } = useData();

  const currentJalali = toJalali();
  const [selectedYear, setSelectedYear] = useState<number>(currentJalali.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentJalali.month);
  const [model, setModel] = useState<SettlementModel>(settings.default_settlement_model || 'total_share');
  const [showPrintView, setShowPrintView] = useState(false);

  // محاسبه لحظه‌ای و قطعی سود بر اساس اطلاعات دیتابیس
  const settlementRecord = calculateMonthlySettlement(selectedYear, selectedMonth, model);

  const handleFinalize = () => {
    finalizeSettlement(settlementRecord);
    alert('تسویه‌حساب این ماه با موفقیت به عنوان وضعیت نهایی ثبت شد.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* هدر بخش تسویه */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-emerald-600" />
            حسابداری، تسویه سود ماهانه و ارائه به مدیریت
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            محاسبه قطعی درآمدها، کسر هزینه‌های مغازه و تفکیک سهم پرسنل بر مبنای ماه‌های شمسی
          </p>
        </div>

        {/* دکمه‌های خروجی رسمی */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSettlementToExcel(settlementRecord)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            خروجی اکسل (.xlsx)
          </button>

          <button
            onClick={() => setShowPrintView(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            برگه رسمی چاپ A4 برای صاحب کافی‌نت
          </button>
        </div>
      </div>

      {/* انتخاب دوره و مدل محاسبه */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* انتخاب ماه شمسی */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ماه شمسی تسویه:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
          >
            {JALALI_MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* انتخاب سال شمسی */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            سال شمسی:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
          >
            {[1402, 1403, 1404, 1405, 1406].map((yr) => (
              <option key={yr} value={yr}>
                سال {yr}
              </option>
            ))}
          </select>
        </div>

        {/* انتخاب فرمول محاسبه سود */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            مدل محاسبه سود پرسنل:
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as SettlementModel)}
            className="w-full h-10 px-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 text-xs font-bold"
          >
            <option value="total_share">روش اول: شراکتی (درصد از سود کل خالص مغازه)</option>
            <option value="individual_performance">روش دوم: پورسانت عملکردی فردی (با تسهیم هزینه)</option>
          </select>
        </div>
      </div>

      {/* کارت‌های خلاصه مالی کلان ماه */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>مجموع درآمدهای واقعی این ماه</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-slate-100">
            {formatToman(settlementRecord.total_income)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">حاصل از کل فاکتورهای ثبت شده</div>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>مجموع هزینه‌های تاییدشده مغازه</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {formatToman(settlementRecord.total_expense)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">کسر شده از درآمد ماه</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-md shadow-emerald-600/20">
          <div className="flex items-center justify-between text-emerald-100 mb-1.5 text-xs">
            <span>سود خالص واقعی کافی‌نت (قابل تقسیم)</span>
            <BadgeDollarSign className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-2xl font-black">{formatToman(settlementRecord.net_profit)}</div>
          <div className="text-[10px] text-emerald-200 mt-1">درآمد منهای هزینه‌ها</div>
        </div>
      </div>

      {/* جدول تفکیک سهم پرسنل و اپراتورها */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            جدول سهم و دریافتی هر اپراتور بر اساس درصد مصوب (دوره {JALALI_MONTH_NAMES[selectedMonth - 1]} {selectedYear})
          </h3>
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleFinalize}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              تایید رسمی و بستن تسویه ماه
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">نام پرسنل / اپراتور</th>
                <th className="p-3 text-center">درصد مصوب سهم</th>
                <th className="p-3">درآمد ایجاد شده در شیفت‌ها</th>
                <th className="p-3">سهم هزینه تخصیص‌یافته</th>
                <th className="p-3">سود خالص منتسب</th>
                <th className="p-3 font-extrabold text-emerald-600">مبلغ نهایی پرداختی (پورسانت/سود)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {settlementRecord.details.map((detail) => (
                <tr key={detail.user_id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750">
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {detail.user_name}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                      {detail.profit_percentage}٪
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {formatToman(detail.user_income)}
                  </td>
                  <td className="p-3 text-rose-600 dark:text-rose-400">
                    {formatToman(detail.user_allocated_expense)}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                    {formatToman(detail.user_net_profit)}
                  </td>
                  <td className="p-3 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {formatToman(detail.user_share_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= مودال برگه چاپی رسمی A4 مخصوص صاحب کافی‌نت ================= */}
      {showPrintView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-3xl bg-white text-black rounded-2xl shadow-2xl p-6 max-h-[94vh] overflow-y-auto">
            {/* نوار بالایی ابزار */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-700">
                پیش‌نمایش سند رسمی تسویه ماهانه (جهت ارائه روی میز صاحب کافی‌نت)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  چاپ مستقیم / ذخیره PDF
                </button>
                <button
                  onClick={() => setShowPrintView(false)}
                  className="px-3 py-2 border rounded-xl text-xs font-medium text-slate-600"
                >
                  بستن
                </button>
              </div>
            </div>

            {/* برگه استاندارد A4 */}
            <div id="printable-settlement" className="p-8 border border-slate-300 bg-white font-sans text-xs leading-relaxed space-y-6">
              {/* سربرگ شرکت / کافی‌نت */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{settings.name}</h1>
                  <p className="text-xs text-slate-600 mt-1">{settings.address} | تلفن: {settings.phone}</p>
                </div>
                <div className="text-left space-y-1">
                  <div className="font-bold text-sm text-blue-800">برگه رسمی تسویه‌حساب ماهیانه</div>
                  <div>دوره مالی: <strong className="text-slate-900">{JALALI_MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong></div>
                  <div>تاریخ صدور گزارش: <span>{formatJalaliDateTime()}</span></div>
                </div>
              </div>

              {/* خلاصه کلان وضعیت مالی */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-slate-500 text-[11px]">مجموع درآمدهای واقعی</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                    {formatToman(settlementRecord.total_income)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">مجموع هزینه‌های مغازه</div>
                  <div className="text-sm font-extrabold text-rose-600 mt-1">
                    {formatToman(settlementRecord.total_expense)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px]">سود خالص نهایی کسب‌وکار</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">
                    {formatToman(settlementRecord.net_profit)}
                  </div>
                </div>
              </div>

              {/* جدول سهم پرسنل */}
              <div>
                <h3 className="font-bold text-xs mb-2">ریز محاسبات و سهم پرداختی پرسنل و مدیریت:</h3>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead className="bg-slate-100">
                    <tr className="border-b border-slate-300">
                      <th className="p-2 border-l border-slate-300 text-center w-12">ردیف</th>
                      <th className="p-2 border-l border-slate-300">نام و نام خانوادگی</th>
                      <th className="p-2 border-l border-slate-300 text-center w-24">درصد سهم</th>
                      <th className="p-2 border-l border-slate-300 text-center">درآمد تولیدی</th>
                      <th className="p-2 border-l border-slate-300 text-center">سهم هزینه</th>
                      <th className="p-2 border-l border-slate-300 text-center">سود خالص فرد</th>
                      <th className="p-2 text-center font-bold">مبلغ نهایی پرداختی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementRecord.details.map((d, idx) => (
                      <tr key={idx} className="border-b border-slate-200 text-center">
                        <td className="p-2 border-l border-slate-200">{idx + 1}</td>
                        <td className="p-2 border-l border-slate-200 text-right font-semibold">{d.user_name}</td>
                        <td className="p-2 border-l border-slate-200">{d.profit_percentage}٪</td>
                        <td className="p-2 border-l border-slate-200">{formatToman(d.user_income)}</td>
                        <td className="p-2 border-l border-slate-200 text-rose-600">{formatToman(d.user_allocated_expense)}</td>
                        <td className="p-2 border-l border-slate-200">{formatToman(d.user_net_profit)}</td>
                        <td className="p-2 font-bold text-emerald-700">{formatToman(d.user_share_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* بخش تایید و امضای رسمی طرفین */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center border-t border-slate-300">
                <div className="space-y-12">
                  <div className="font-bold text-xs text-slate-800">امضا و تایید متصدی / اپراتورها:</div>
                  <div className="text-[11px] text-slate-400">محل امضا: .......................................</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-xs text-slate-800">امضا و تایید مدیریت کافی‌نت:</div>
                  <div className="text-[11px] text-slate-400">محل امضا و مهر: .......................................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
