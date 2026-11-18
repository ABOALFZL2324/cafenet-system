import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getFullJalaliString, formatJalaliTime } from '../../utils/jalali';
import { Lock, Sun, Moon, LogOut, Clock, ShieldCheck, Keyboard } from 'lucide-react';

interface TitleBarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenShortcuts?: () => void;
  isClientMode?: boolean;
  isServerOnline?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  darkMode,
  setDarkMode,
  onOpenShortcuts,
  isClientMode = false,
  isServerOnline = true,
}) => {
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
    <header className="h-14 bg-white/95 dark:bg-[#1f1f23]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 px-4 flex items-center justify-between z-30 select-none shadow-sm transition-colors">
      {/* بخش راست: لوگو و نام کافی‌نت */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25 text-sm ring-2 ring-white/20">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="لوگو" className="w-full h-full object-contain p-1 rounded-xl" />
          ) : (
            'CN'
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
              {settings.name}
            </h1>
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-1 shadow-xs">
              نسخه ۱.۰.۰
            </span>
            {isClientMode && (
              isServerOnline ? (
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  متصل به سیستم اصلی
                </span>
              ) : (
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/40 flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  سیستم اصلی آفلاین
                </span>
              )
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium">
            سامانه جامع مدیریت دخل، سفارشات و شیفت‌های کاری
          </p>
        </div>
      </div>

      {/* بخش وسط: ساعت زنده و تاریخ رسمی شمسی با استایل مدرن */}
      <div className="hidden md:flex items-center gap-3 text-xs bg-slate-100/80 dark:bg-zinc-800/70 px-4 py-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        <span className="font-bold text-slate-700 dark:text-zinc-200">{currentDate}</span>
        <span className="text-slate-300 dark:text-zinc-600">|</span>
        <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm tracking-wider">
          {currentTime}
        </span>
      </div>

      {/* بخش چپ: وضعیت متصدی، راهنمای میانبرها، قفل سریع و تم */}
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 bg-slate-100/80 dark:bg-zinc-800/70 pl-3 pr-2 py-1 rounded-2xl border border-slate-200/70 dark:border-zinc-700/70 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-blue-500/30">
              {currentUser.full_name[0]}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                {currentUser.role === 'admin' ? (
                  <span className="text-blue-600 dark:text-blue-400 font-bold">مدیر سیستم</span>
                ) : (
                  <span>متصدی شیفت</span>
                )}
                {currentShift && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    شیفت فعال
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* دکمه راهنمای کلیدهای میانبر */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            title="راهنمای کلیدهای میانبر سریع (کلید ?)"
            className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* دکمه قفل سریع صفحه */}
        <button
          onClick={lockScreen}
          title="قفل سریع صفحه (Alt + L) - مخفی‌سازی مالی در حضور مشتری"
          className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-800/40 flex items-center gap-1"
        >
          <Lock className="w-4 h-4" />
          <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-300 rounded hidden xl:inline">
            Alt+L
          </span>
        </button>

        {/* سوئیچ تم تاریک و روشن */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="تغییر تم تاریک / روشن"
          className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* خروج */}
        {currentUser && (
          <button
            onClick={logout}
            title="خروج از حساب کاربری"
            className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
