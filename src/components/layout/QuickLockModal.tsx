import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock } from 'lucide-react';

export const QuickLockModal: React.FC = () => {
  const { currentUser, isLocked, unlockScreen } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

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
    const success = unlockScreen(pin);
    if (!success) {
      setError('پین‌کد اشتباه است.');
      setPin('');
    } else {
      setPin('');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-6 text-center border border-slate-200 dark:border-zinc-700">
        <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">صفحه قفل است</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4">
          کاربر: <strong className="text-slate-700 dark:text-slate-200">{currentUser.full_name}</strong>
        </p>

        {/* فیلد پین */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-9 h-11 rounded-lg border flex items-center justify-center text-lg font-bold ${
                pin.length > idx
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900'
              }`}
            >
              {pin.length > idx ? '●' : ''}
            </div>
          ))}
        </div>
        {error && <div className="text-[11px] text-rose-500 font-semibold mb-3">{error}</div>}

        {/* کیپد */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 text-xs font-semibold"
          >
            پاک کردن
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700/60 text-sm font-bold text-slate-800 dark:text-slate-100"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20"
          >
            بازگشایی
          </button>
        </div>
      </div>
    </div>
  );
};
