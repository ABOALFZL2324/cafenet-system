import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { normalizeDigits } from '../../utils/security';
import { Lock, Keyboard, Delete, ShieldAlert } from 'lucide-react';

export const QuickLockModal: React.FC = () => {
  const { currentUser, isLocked, unlockScreen } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // شنونده کلیدهای فیزیکی کیبورد در حالت قفل (با پشتیبانی از کیبورد فارسی و انگلیسی)
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const normalizedKey = normalizeDigits(e.key);
      if (/^[0-9]$/.test(normalizedKey)) {
        if (pin.length < 6) {
          setPin((prev) => prev + normalizedKey);
          setError('');
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        handleUnlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pin]);

  if (!isLocked || !currentUser) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleUnlock = () => {
    const result = unlockScreen(pin);
    if (!result.success) {
      setError(result.message || 'پین‌کد اشتباه است.');
      setPin('');
    } else {
      setPin('');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 no-print animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white dark:bg-[#202024] rounded-3xl shadow-2xl p-7 text-center border border-slate-200/80 dark:border-zinc-800 transition-all">
        {/* آیکون قفل طلایی درخشان */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 ring-4 ring-amber-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-base font-black text-slate-800 dark:text-white">صفحه قفل امنیتی است</h3>
        <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1 mb-5">
          متصدی حاضر: <strong className="text-slate-700 dark:text-zinc-200 font-bold">{currentUser.full_name}</strong>
        </p>

        {/* فیلد دایره‌های پین */}
        <div className="flex justify-center gap-2.5 mb-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-11 h-12 rounded-2xl border flex items-center justify-center text-2xl font-black transition-all ${
                pin.length > idx
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30 scale-105'
                  : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-transparent'
              }`}
            >
              {pin.length > idx ? '●' : ''}
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 mb-4 flex items-center justify-center gap-1.5 font-medium">
          <Keyboard className="w-3.5 h-3.5" />
          <span>پین‌کد را با کیبورد یا دکمه‌های زیر وارد کرده و اینتر بزنید</span>
        </div>

        {error && (
          <div className="text-xs text-rose-500 font-black mb-4 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
            {error}
          </div>
        )}

        {/* کیپد عددی */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-base font-black text-slate-800 dark:text-white transition-all active:scale-95 shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 flex items-center justify-center transition-all active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-base font-black text-slate-800 dark:text-white transition-all active:scale-95 shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            className="h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all active:scale-95 shadow-md shadow-amber-500/30"
          >
            بازگشایی
          </button>
        </div>
      </div>
    </div>
  );
};
