import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { Printer, Calculator, Check, X } from 'lucide-react';

interface PrintCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToInvoice: (title: string, quantity: number, unitPrice: number) => void;
}

export const PrintCalculatorModal: React.FC<PrintCalculatorModalProps> = ({
  isOpen,
  onClose,
  onAddToInvoice,
}) => {
  const { services } = useData();

  const [pages, setPages] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [isDoubleSided, setIsDoubleSided] = useState<boolean>(false);
  const [copies, setCopies] = useState<number>(1);

  if (!isOpen) return null;

  // استخراج نرخ‌های مصوب از دیتابیس (بدون هاردکد!)
  const bwSingle = services.find((s) => s.id === 1)?.unit_price || 3000;
  const bwDouble = services.find((s) => s.id === 2)?.unit_price || 5000;
  const colorSingle = services.find((s) => s.id === 3)?.unit_price || 15000;
  const colorDouble = colorSingle * 1.8; // نرخ دورو رنگی

  // محاسبه قیمت هر برگ
  let unitPrice = 0;
  if (!isColor) {
    unitPrice = isDoubleSided ? bwDouble : bwSingle;
  } else {
    unitPrice = isDoubleSided ? colorDouble : colorSingle;
  }

  const totalSheets = isDoubleSided ? Math.ceil(pages / 2) : pages;
  const totalAmount = totalSheets * unitPrice * copies;

  const handleApply = () => {
    const typeLabel = `${pages} صفحه ${isColor ? 'رنگی' : 'سیاه‌سفید'} (${isDoubleSided ? 'دورو' : 'تک‌رو'}) ${copies > 1 ? `در ${copies} سری` : ''}`;
    onAddToInvoice(typeLabel, 1, totalAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-750">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-sm">
            <Calculator className="w-5 h-5" />
            <span>محاسبه‌گر سریع پرینت و کپی</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فیلدها */}
        <div className="space-y-4 my-5">
          {/* تعداد صفحات */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تعداد صفحات فایل / سند:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 font-bold text-center text-sm font-mono"
              />
              <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0">صفحه</span>
            </div>
          </div>

          {/* نوع چاپ (رنگی یا سیاه‌سفید) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              نوع رنگ چاپ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsColor(false)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !isColor
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                سیاه‌سفید ({formatToman(bwSingle)})
              </button>
              <button
                type="button"
                onClick={() => setIsColor(true)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isColor
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                رنگی ({formatToman(colorSingle)})
              </button>
            </div>
          </div>

          {/* تک‌رو یا دورو */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              حالت چاپ برگه:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDoubleSided(false)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !isDoubleSided
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                تک‌رو
              </button>
              <button
                type="button"
                onClick={() => setIsDoubleSided(true)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isDoubleSided
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600'
                    : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                }`}
              >
                دورو (صرفه‌جویی در کاغذ)
              </button>
            </div>
          </div>

          {/* تعداد سری (نسخه) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              تعداد نسخه (سری کامل):
            </label>
            <input
              type="number"
              min="1"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 font-bold text-center text-sm font-mono"
            />
          </div>
        </div>

        {/* نتیجه محاسبه */}
        <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 mb-4">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 mb-1.5">
            <span>تعداد کاغذ مصرفی:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{totalSheets * copies} برگ A4</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-200/60 dark:border-zinc-750">
            <span className="text-slate-700 dark:text-slate-200">مبلغ نهایی قابل دریافت:</span>
            <span className="text-blue-600 dark:text-blue-400 text-base font-extrabold">{formatToman(totalAmount)}</span>
          </div>
        </div>

        {/* دکمه اعمال */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            افزودن این مبلغ به فاکتور
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-700"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
