import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { toJalali, JALALI_MONTH_NAMES } from '../../utils/jalali';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertOctagon,
  CreditCard,
  Banknote,
  PieChart,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { invoices, services } = useData();

  const currentJalali = toJalali();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'this_month'>('all');

  // استخراج تمام اقلام فاکتور
  const relevantInvoices = invoices.filter((inv) => {
    if (filterPeriod === 'all') return true;
    const j = toJalali(inv.created_at);
    return j.year === currentJalali.year && j.month === currentJalali.month;
  });

  // تجمیع درآمد و تکرار بر اساس عنوان خدمت
  const serviceStatsMap: {
    [key: string]: { title: string; count: number; totalRevenue: number };
  } = {};

  relevantInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const key = item.service_title;
      if (!serviceStatsMap[key]) {
        serviceStatsMap[key] = { title: key, count: 0, totalRevenue: 0 };
      }
      serviceStatsMap[key].count += item.quantity;
      serviceStatsMap[key].totalRevenue += item.total_price;
    });
  });

  const statsList = Object.values(serviceStatsMap);

  // پردرآمدترین خدمات (مرتب بر اساس حجم ریالی)
  const topRevenueServices = [...statsList].sort((a, b) => b.totalRevenue - a.totalRevenue);

  // پرتقاضاترین خدمات (مرتب بر اساس تعداد بار ارائه)
  const mostRequestedServices = [...statsList].sort((a, b) => b.count - a.count);

  // کل درآمد فاکتورهای فیلترشده
  const totalFilteredIncome = relevantInvoices.reduce((acc, i) => acc + i.final_amount, 0);

  // نسبت روش پرداخت
  const posIncome = relevantInvoices
    .filter((i) => i.payment_method === 'pos')
    .reduce((acc, i) => acc + i.final_amount, 0);

  const cashIncome = relevantInvoices
    .filter((i) => i.payment_method === 'cash')
    .reduce((acc, i) => acc + i.final_amount, 0);

  const posPercentage = totalFilteredIncome > 0 ? Math.round((posIncome / totalFilteredIncome) * 100) : 0;
  const cashPercentage = totalFilteredIncome > 0 ? 100 - posPercentage : 0;

  // خدماتی که در نرخ‌نامه هستند اما در این بازه هیچ فروشی نداشته‌اند (خدمات راکد)
  const usedTitles = new Set(statsList.map((s) => s.title));
  const unusedServices = services.filter((s) => !usedTitles.has(s.title) && s.is_active);

  return (
    <div className="space-y-4 text-right">
      {/* هدر */}
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            هوش تجاری و تحلیل آماری خدمات کافی‌نت
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تحلیل پرفروش‌ترین‌ها، پرتقاضاترین‌ها و نسبت دریافتی‌ها بر پایه اطلاعات واقعی
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-zinc-700 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterPeriod('this_month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterPeriod === 'this_month'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            فقط این ماه ({JALALI_MONTH_NAMES[currentJalali.month - 1]})
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterPeriod === 'all'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            کل تاریخچه سیستم
          </button>
        </div>
      </div>

      {/* ۳ کارت برجسته شاخص‌های هوشمند */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* پردرآمدترین */}
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>🥇 پردرآمدترین خدمت</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          {topRevenueServices.length > 0 ? (
            <div>
              <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                {topRevenueServices[0].title}
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-1">
                {formatToman(topRevenueServices[0].totalRevenue)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">هنوز آماری ثبت نشده است.</div>
          )}
        </div>

        {/* پرتقاضاترین */}
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>🔄 پرتقاضاترین (بیشترین تکرار)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          {mostRequestedServices.length > 0 ? (
            <div>
              <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                {mostRequestedServices[0].title}
              </div>
              <div className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-1">
                {mostRequestedServices[0].count} بار مراجعه و ارائه خدمت
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">هنوز آماری ثبت نشده است.</div>
          )}
        </div>

        {/* سهم پرداخت‌ها */}
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>💳 سهم روش‌های پرداخت</span>
            <PieChart className="w-4 h-4 text-purple-500" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-semibold">کارتخوان (POS): {posPercentage}٪</span>
              <span className="text-emerald-600 font-semibold">نقدی: {cashPercentage}٪</span>
            </div>
            {/* نوار پیشرفت */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-700 overflow-hidden flex">
              <div style={{ width: `${posPercentage}%` }} className="h-full bg-blue-600"></div>
              <div style={{ width: `${cashPercentage}%` }} className="h-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول دو ستونه تفکیک و رتبه‌بندی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* رتبه‌بندی خدمات از نظر درآمدزایی */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-4">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            رتبه‌بندی خدمات بر اساس مجموع درآمدزایی
          </h3>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {topRevenueServices.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">داده‌ای ثبت نشده است.</div>
            ) : (
              topRevenueServices.map((service, idx) => {
                const ratio =
                  totalFilteredIncome > 0
                    ? Math.round((service.totalRevenue / totalFilteredIncome) * 100)
                    : 0;
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-750">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {service.title}
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {formatToman(service.totalRevenue)} ({ratio}٪)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, ratio * 2)}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* خدمات راکد و کم‌استفاده */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-4">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-500" />
            خدمات کم‌استفاده یا راکد (بدون تقاضا در این بازه)
          </h3>

          <p className="text-[11px] text-slate-500 mb-3">
            این خدمات در نرخ‌نامه تعریف شده‌اند اما در بازه انتخابی فروشی نداشته‌اند:
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {unusedServices.length === 0 ? (
              <div className="text-xs text-emerald-600 text-center py-6 font-semibold">
                تمامی خدمات تعریف‌شده در این بازه فعال بوده و مشتری داشته‌اند!
              </div>
            ) : (
              unusedServices.map((service) => (
                <div
                  key={service.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-750 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{service.title}</span>
                  <span className="text-[10px] text-slate-400">بدون فروش در این بازه</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
