import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldCheck, UserCheck, ArrowLeft, Keyboard } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, settings } = useData();
  const { loginWithPin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const activeUsers = users.filter((u) => u.is_active);

  // فوکوس خودکار هنگام انتخاب کاربر
  useEffect(() => {
    if (selectedUserId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUserId]);

  // شنونده کلیدهای فیزیکی کیبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedUserId) return;

      // اعداد 0 تا 9 یا Numpad
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 6) {
          setPin((prev) => prev + e.key);
          setError('');
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUserId, pin]);

  const handleSelectUser = (id: number) => {
    setSelectedUserId(id);
    setPin('');
    setError('');
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (!selectedUserId) {
      setError('لطفاً ابتدا کاربر خود را انتخاب کنید.');
      return;
    }
    if (!pin) {
      setError('لطفاً پین‌کد خود را وارد کنید.');
      return;
    }

    const result = loginWithPin(selectedUserId, pin);
    if (!result.success) {
      setError(result.message || 'پین‌کد وارد شده اشتباه است.');
      setPin('');
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700/80 p-6 text-center">
        {/* لوگو و عنوان */}
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="لوگو" className="h-16 mx-auto mb-3 object-contain" />
        ) : (
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{settings.name}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-6">
          سامانه یکپارچه مدیریت مالی، شیفت و عملیات کافی‌نت
        </p>

        {!selectedUserId ? (
          /* مرحله ۱: انتخاب کاربر */
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 text-right">
              اپراتور / متصدی شیفت را انتخاب کنید:
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {user.full_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {user.role === 'admin' ? 'مدیر سیستم' : 'متصدی'} | سهم سود: {user.profit_percentage}٪
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">ورود &larr;</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* مرحله ۲: ورود پین‌کد با کیبورد یا کیپد */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedUserId(null)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                تغییر کاربر
              </button>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {selectedUser?.full_name}
              </div>
            </div>

            {/* ورودی مخفی برای فوکوس کیبورد */}
            <input
              ref={inputRef}
              type="password"
              className="opacity-0 absolute -z-10"
              autoFocus
            />

            {/* نمایش پین‌کد */}
            <div className="mb-4">
              <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-center gap-1">
                <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                <span>پین‌کد عددی را با <strong>کیبورد</strong> یا کلیک وارد کنید:</span>
              </div>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                      pin.length > idx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-transparent'
                    }`}
                  >
                    {pin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>
              {error && <div className="text-[11px] text-rose-500 font-semibold mt-2">{error}</div>}
            </div>

            {/* کیپد عددی */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumberClick(digit)}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDelete}
                className="h-11 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-semibold transition-all active:scale-95"
              >
                پاک کردن
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/20"
              >
                تایید (Enter)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
