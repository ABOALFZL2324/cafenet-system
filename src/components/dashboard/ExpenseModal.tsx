import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { PaymentMethod } from '../../types';
import { ArrowDownCircle, Check, X } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentShift } = useAuth();
  const { addExpense } = useData();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !currentUser) return null;

  const quickTitles = [
    'خرید بسته کاغذ A4',
    'شارژ کارتریج / تونر پرینتر',
    'چای، قند و ملزومات پذیرایی مغازه',
    'خرید کاور و پوشه اداری',
    'پرداخت قبض برق / گاز / آب مغازه',
    'شارژ اینترنت پرسرعت کافی‌نت',
    'تعمیرات جزئی و سرویس دستگاه',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseTomanInput(amountStr);
    if (!title.trim()) {
      setError('لطفاً عنوان هزینه را وارد کنید.');
      return;
    }
    if (amount <= 0) {
      setError('مبلغ هزینه باید بیشتر از صفر باشد.');
      return;
    }

    addExpense({
      shift_id: currentShift ? currentShift.id : 0,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      title: title.trim(),
      amount,
      paymentMethod,
      description: description.trim() || undefined,
    });

    // پاکسازی فرم و بستن
    setTitle('');
    setAmountStr('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-750">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-sm">
            <ArrowDownCircle className="w-5 h-5" />
            <span>ثبت هزینه اختصاصی مغازه (کافی‌نت)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">
          * توجه: تنها هزینه‌های واقعی مربوط به کافی‌نت ثبت شوند؛ این مبالغ در پایان ماه از سود کل کسر خواهند شد.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          {/* عناوین پرکاربرد سریع */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              انتخاب سریع عنوان هزینه:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTitles.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTitle(qt)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          {/* فیلد عنوان */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان هزینه:
            </label>
            <input
              type="text"
              required
              placeholder="مثلا: خرید ۲ بسته کاغذ دابل A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 text-xs font-semibold"
            />
          </div>

          {/* مبلغ هزینه */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              مبلغ هزینه (تومان):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="مثلا: ۲۵۰,۰۰۰"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 font-bold text-sm text-left pl-14 font-mono"
                dir="ltr"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400 font-medium">تومان</span>
            </div>
            {amountStr && (
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                {formatToman(parseTomanInput(amountStr))}
              </div>
            )}
          </div>

          {/* روش پرداخت */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              روش پرداخت هزینه:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                پرداخت از صندوق نقدی
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('pos')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'pos'
                    ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                کارتخوان / حساب بانکی مغازه
              </button>
            </div>
          </div>

          {/* توضیحات */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات تکمیلی (اختیاری):
            </label>
            <textarea
              rows={2}
              placeholder="توضیحات یا شماره فاکتور خرید..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 text-xs resize-none"
            />
          </div>

          {error && <div className="text-xs text-rose-500 font-semibold">{error}</div>}

          {/* دکمه‌ها */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              ثبت قطعی هزینه مغازه
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-700"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
