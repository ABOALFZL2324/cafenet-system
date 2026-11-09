import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getFullJalaliString, formatJalaliTime } from '../../utils/jalali';
import { Lock, Sun, Moon, LogOut, Clock, UserCheck, Shield } from 'lucide-react';

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
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-white/80 dark:bg-[#252525]/90 backdrop-blur-md border-b border-fluent-border dark:border-fluent-darkBorder px-4 flex items-center justify-between z-20">
      {/* عنوان و لوگو */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
          CN
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            {settings.name}
            <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
              ویندوز ۱۱
            </span>
          </h1>
        </div>
      </div>

      {/* ساعت و تاریخ زنده شمسی */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-medium">{currentDate}</span>
        <span className="text-slate-300 dark:text-zinc-600">|</span>
        <span className="font-bold tracking-wider">{currentTime}</span>
      </div>

      {/* بخش وضعیت کاربر و دکمه‌های کنترلی */}
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                {currentUser.role === 'admin' ? 'مدیر سیستم' : 'متصدی'} 
                {currentShift ? ' (شیفت فعال)' : ' (بدون شیفت)'}
              </div>
            </div>
          </div>
        )}

        {/* دکمه قفل سریع حریم خصوصی */}
        <button
          onClick={lockScreen}
          title="قفل سریع صفحه (مخفی‌سازی اطلاعات مالی در حضور مشتری)"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* سوئیچ تم تاریک و روشن */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="تغییر تم تاریک / روشن"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* دکمه خروج کاربر */}
        {currentUser && (
          <button
            onClick={logout}
            title="خروج از حساب کاربری"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
