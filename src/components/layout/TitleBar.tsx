import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getFullJalaliString, formatJalaliTime } from '../../utils/jalali';
import { Lock, Sun, Moon, LogOut, Clock, UserCheck, Shield, Sparkles, Monitor } from 'lucide-react';

interface TitleBarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ darkMode, setDarkMode }) => {
  const { currentUser, currentShift, lockScreen, logout } = useAuth();
  const { settings } = useData();
  const [currentTime, setCurrentTime] = useState<string>(formatJalaliTime());
  const [currentDate, setCurrentDate] = useState<string>(getFullJalaliString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatJalaliTime());
      setCurrentDate(getFullJalaliString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-white/95 dark:bg-[#252525]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-700/80 px-4 flex items-center justify-between z-30 select-none shadow-sm">
      {/* بخش راست: لوگو و نام کسب‌وکار */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20 text-sm">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="لوگو" className="w-full h-full object-contain p-1 rounded-xl" />
          ) : (
            'CN'
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {settings.name}
            </h1>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              آفلاین و امن
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-400">
            سیستم مدیریت هوشمند کافی‌نت و خدمات اینترنتی
          </p>
        </div>
      </div>

      {/* بخش وسط: ساعت زنده و تاریخ رسمی شمسی */}
      <div className="hidden lg:flex items-center gap-3 text-xs bg-slate-100/90 dark:bg-zinc-800/90 px-4 py-1.5 rounded-xl border border-slate-200/70 dark:border-zinc-700/70 shadow-inner">
        <Clock className="w-4 h-4 text-blue-500 animate-spin-slow" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">{currentDate}</span>
        <span className="text-slate-300 dark:text-zinc-600">|</span>
        <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm tracking-wider">
          {currentTime}
        </span>
      </div>

      {/* بخش چپ: وضعیت متصدی، قفل سریع و تم */}
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              {currentUser.full_name[0]}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                {currentUser.role === 'admin' ? (
                  <span className="text-blue-600 font-semibold">مدیریت</span>
                ) : (
                  <span>متصدی ({currentUser.profit_percentage}٪)</span>
                )}
                {currentShift && <span className="text-emerald-600 font-bold">• شیفت فعال</span>}
              </div>
            </div>
          </div>
        )}

        {/* دکمه قفل سریع صفحه */}
        <button
          onClick={lockScreen}
          title="قفل سریع صفحه (Alt + L) - مخفی‌سازی مالی در حضور مشتری"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-800/40"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* سوئیچ تم تاریک و روشن */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="تغییر تم تاریک / روشن"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* خروج */}
        {currentUser && (
          <button
            onClick={logout}
            title="خروج از حساب کاربری"
            className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
