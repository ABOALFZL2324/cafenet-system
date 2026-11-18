import React from 'react';
import { Keyboard, X, Sparkles, Check } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'ثبت فاکتور و دریافتی جدید (از هر کجای برنامه)' },
    { key: 'Alt + L', desc: 'قفل سریع و امن صفحه (جهت مخفی‌سازی مالی در حضور مشتری)' },
    { key: 'Esc', desc: 'بستن سریع پنجره‌ها و مودال‌های باز' },
    { key: 'F1', desc: 'داشبورد و وضعیت دخل زنده امروز' },
    { key: 'F2', desc: 'میز کار سفارشات معلق و مدارک مشتریان' },
    { key: 'F2 (درون فاکتور)', desc: 'ثبت نهایی و صدور فوری فاکتور' },
    { key: 'F3', desc: 'آرشیو فاکتورها و فیلتر دریافتی‌ها' },
    { key: 'F4', desc: 'ثبت فوری هزینه جدید مغازه' },
    { key: 'F5', desc: 'محاسبه و تسویه سود ماهانه پرسنل' },
    { key: 'F6', desc: 'نرخ‌نامه و تعرفه مصوب خدمات' },
    { key: 'F7', desc: 'گزارشات آماری و هوش تجاری' },
    { key: '?', desc: 'نمایش همین پنجره راهنمای میانبرها' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 no-print animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white dark:bg-[#202024] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-right">
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-black text-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <span>راهنمای کلیدهای میانبر کیبورد (عملکرد سریع)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* لیست کلیدهای میانبر */}
        <div className="my-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs"
            >
              <span className="font-bold text-slate-700 dark:text-zinc-200">{item.desc}</span>
              <kbd className="px-2.5 py-1 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono font-black rounded-lg border border-slate-200 dark:border-zinc-700 shadow-2xs text-[11px] shrink-0" dir="ltr">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* دکمه بستن */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/25 active:scale-95"
        >
          متوجه شدم (Esc)
        </button>
      </div>
    </div>
  );
};
