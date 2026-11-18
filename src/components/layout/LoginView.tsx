import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { normalizeDigits } from '../../utils/security';
import { ShieldCheck, UserCheck, ArrowRight, Keyboard, Delete, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, settings } = useData();
  const { loginWithPin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const activeUsers = users.filter((u) => u.is_active && !u.is_deleted);

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

      const normalizedKey = normalizeDigits(e.key);

      // اعداد 0 تا 9 (انگلیسی یا فارسی کیبورد)
      if (/^[0-9]$/.test(normalizedKey)) {
        if (pin.length < 6) {
          setPin((prev) => prev + normalizedKey);
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
    <div className="min-h-screen bg-radial from-slate-100 via-slate-200 to-slate-300 dark:from-[#18181c] dark:via-[#121215] dark:to-black flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white/95 dark:bg-[#202024]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 p-7 text-center transition-all">
        {/* لوگو و نام کسب‌وکار */}
        <div className="mb-5">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="لوگو" className="h-16 mx-auto mb-3 object-contain drop-shadow" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3 ring-4 ring-blue-500/20">
              <ShieldCheck className="w-9 h-9" />
            </div>
          )}
          <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{settings.name}</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1">
            سامانه یکپارچه مدیریت مالی، شیفت و عملیات کافی‌نت
          </p>
        </div>

        {!selectedUserId ? (
          /* مرحله ۱: انتخاب کاربر */
          <div className="animate-fade-in">
            <div className="text-xs font-black text-slate-600 dark:text-zinc-300 mb-3 text-right flex items-center justify-between">
              <span>اپراتور یا مدیر را جهت ورود انتخاب کنید:</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{activeUsers.length} کاربر فعال</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group active:scale-[0.99] shadow-2xs bg-white dark:bg-zinc-850"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs font-black text-sm">
                      {user.full_name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-400">
                        {user.role === 'admin' ? 'مدیر ارشد سیستم' : `متصدی (${user.profit_percentage}٪ سهم)`}
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <ArrowRight className="w-4 h-4 transform rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* مرحله ۲: ورود پین‌کد */
          <div className="animate-fade-in">
            {/* کارت کاربر انتخاب شده */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {selectedUser?.full_name[0]}
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-slate-800 dark:text-white">
                    {selectedUser?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                    {selectedUser?.role === 'admin' ? 'مدیریت' : 'متصدی'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold px-2 py-1 rounded-lg"
              >
                تغییر کاربر
              </button>
            </div>

            {/* نمایش دایره‌های پین‌کد */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-2xl border flex items-center justify-center text-2xl font-black transition-all ${
                    pin.length > idx
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-105'
                      : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-transparent'
                  }`}
                >
                  {pin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 mb-4 flex items-center justify-center gap-1.5 font-medium">
              <Keyboard className="w-3.5 h-3.5" />
              <span>پین‌کد را با کیبورد فیزیکی یا صفحه کلید زیر وارد کنید</span>
            </div>

            {error && (
              <div className="text-xs text-rose-500 font-black mb-4 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                {error}
              </div>
            )}

            {/* صفحه کلید عددی (Numpad) */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumberClick(digit)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-base font-black text-slate-800 dark:text-white transition-all active:scale-95 shadow-2xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 flex items-center justify-center transition-all active:scale-95 text-xs font-bold"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-base font-black text-slate-800 dark:text-white transition-all active:scale-95 shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all active:scale-95 shadow-md shadow-blue-600/30"
              >
                ورود
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
