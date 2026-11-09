import React from 'react';
import { useData } from '../../context/DataContext';
import { formatJalaliDateTime } from '../../utils/jalali';
import { Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export const ShiftsView: React.FC = () => {
  const { shifts } = useData();

  // محاسبه مدت زمان کارکرد (ساعت و دقیقه)
  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'در حال اجرا...';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعت و ${minutes} دقیقه`;
  };

  return (
    <div className="space-y-4 text-right">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          دفتر لاگ شیفت‌ها، ساعات حضور و پیام‌های تحویل
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          تاریخچه دقیق ورود و خروج متصدیان کافی‌نت به صورت اتوماتیک
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">ردیف</th>
                <th className="p-3">متصدی شیفت</th>
                <th className="p-3">زمان شروع شیفت</th>
                <th className="p-3">زمان پایان شیفت</th>
                <th className="p-3">مدت کل حضور</th>
                <th className="p-3">وضعیت شیفت</th>
                <th className="p-3">یادداشت تحویل به همکار / مدیر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    شیفتی ثبت نشده است. با زدن دکمه «شروع شیفت» در داشبورد اولین شیفت فعال می‌شود.
                  </td>
                </tr>
              ) : (
                shifts.map((shift, idx) => (
                  <tr key={shift.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{shift.user_name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {formatJalaliDateTime(shift.start_time)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {shift.end_time ? formatJalaliDateTime(shift.end_time) : '-'}
                    </td>
                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">
                      {calculateDuration(shift.start_time, shift.end_time)}
                    </td>
                    <td className="p-3">
                      {shift.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          شیفت باز
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300">
                          بسته شده
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {shift.handover_note ? (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{shift.handover_note}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
