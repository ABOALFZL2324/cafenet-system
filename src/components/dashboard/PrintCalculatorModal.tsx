import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { Printer, Calculator, Check, X, FileText, Layers, Copy } from 'lucide-react';

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

  // استخراج نرخ‌های مصوب از دیتابیس
  const bwSingle = services.find((s) => s.id === 1)?.unit_price || 3000;
  const bwDouble = services.find((s) => s.id === 2)?.unit_price || 5000;
  const colorSingle = services.find((s) => s.id === 3)?.unit_price || 15000;
  const colorDouble = colorSingle * 1.8;

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
    const typeLabel = `پرینت: ${pages} صفحه ${isColor ? 'رنگی' : 'سیاه‌سفید'} (${isDoubleSided ? 'دورو' : 'تک‌رو'}) ${copies > 1 ? `در ${copies} سری` : ''}`;
    onAddToInvoice(typeLabel, 1, totalAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#202024] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-right">
        {/* هدر */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-black text-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <span>محاسبه‌گر سریع پرینت و کپی</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* فیلدها */}
        <div className="space-y-4 my-5">
          {/* تعداد صفحات سند */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1.5">
              تعداد صفحات فایل / جزوه:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white font-black text-center text-sm font-mono focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0 font-bold">صفحه</span>
            </div>
          </div>

          {/* نوع چاپ (رنگی یا سیاه‌سفید) */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1.5">
              نوع رنگ چاپ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsColor(false)}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  !isColor
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                سیاه‌سفید ({formatToman(bwSingle)})
              </button>
              <button
                type="button"
                onClick={() => setIsColor(true)}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  isColor
                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-600 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                تمام‌رنگی ({formatToman(colorSingle)})
              </button>
            </div>
          </div>

          {/* تک‌رو یا دورو */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1.5">
              نحوه چاپ روی برگه:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDoubleSided(false)}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  !isDoubleSided
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                تک‌رو (یک طرف برگه)
              </button>
              <button
                type="button"
                onClick={() => setIsDoubleSided(true)}
                className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                  isDoubleSided
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                دورو (پشت و رو)
              </button>
            </div>
          </div>

          {/* تعداد سری / نسخه */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1.5">
              تعداد نسخه چاپی (سری):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white font-black text-center text-sm font-mono focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0 font-bold">نسخه</span>
            </div>
          </div>
        </div>

        {/* جعبه نتیجه و جمع کل */}
        <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-zinc-900 dark:to-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 mb-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-zinc-400 font-medium">
            <span>تعداد کل برگه مصرفی کاغذ:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">{totalSheets * copies} برگ</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-zinc-400 font-medium">
            <span>نرخ هر برگه:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white">{formatToman(unitPrice)}</span>
          </div>
          <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/50 flex justify-between items-center">
            <span className="text-xs font-black text-blue-900 dark:text-blue-200">مبلغ کل قابل دریافت:</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatToman(totalAmount)}
            </span>
          </div>
        </div>

        {/* دکمه انتقال به فاکتور */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            انتقال به فاکتور و صدور
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
