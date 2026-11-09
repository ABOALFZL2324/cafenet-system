import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface InvoiceViewModalProps {
  invoiceId: number | null;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoiceId, onClose }) => {
  const { invoices, settings } = useData();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a5'>('thermal');

  if (!invoiceId) return null;
  const invoice = invoices.find((inv) => inv.id === invoiceId);
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 flex flex-col max-h-[92vh] overflow-hidden text-right">
        {/* نوار ابزار بالا */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">قطع چاپ فاکتور:</span>
            <div className="flex bg-slate-200 dark:bg-zinc-700 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'thermal'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                رول حرارتی (۸ سانتی‌متر)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'a5'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                فاکتور رسمی A5
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              ارسال به پرینتر / PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوای پیش‌نمایش فاکتور */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 dark:bg-zinc-900 flex justify-center">
          {printFormat === 'thermal' ? (
            /* =================== فرمت فیش حرارتی ۸ سانتی‌متری =================== */
            <div
              id="printable-invoice"
              className="w-[320px] bg-white text-black p-5 shadow-lg border border-slate-200 text-center font-sans text-xs leading-relaxed"
            >
              {/* سربرگ */}
              <div className="border-b-2 border-dashed border-slate-400 pb-3 mb-3">
                <h3 className="font-extrabold text-base tracking-wide">{settings.name}</h3>
                <div className="text-[11px] text-slate-600 mt-0.5">تلفن: {settings.phone}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{settings.address}</div>
              </div>

              {/* مشخصات فاکتور */}
              <div className="text-[11px] space-y-1 text-right mb-3 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره فاکتور:</span>
                  <span className="font-bold">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاریخ و ساعت:</span>
                  <span>{formatJalaliDateTime(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">متصدی:</span>
                  <span>{invoice.user_name || 'اپراتور'}</span>
                </div>
                {invoice.customer_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">مشتری:</span>
                    <span className="font-medium">{invoice.customer_name}</span>
                  </div>
                )}
              </div>

              {/* جدول اقلام */}
              <table className="w-full text-right text-[11px] mb-3">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1">شرح خدمت</th>
                    <th className="py-1 text-center">تعداد</th>
                    <th className="py-1 text-left">مبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5">{item.service_title}</td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-left font-semibold">{formatToman(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* جمع مبالغ */}
              <div className="border-t-2 border-dashed border-slate-400 pt-2 space-y-1 text-right text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">جمع کل خدمات:</span>
                  <span>{formatToman(invoice.total_amount)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>تخفیف:</span>
                    <span>{formatToman(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black">
                  <span>مبلغ پرداختی:</span>
                  <span>{formatToman(invoice.final_amount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>روش پرداخت:</span>
                  <span className="font-bold">{invoice.payment_method === 'cash' ? 'نقدی' : 'کارتخوان'}</span>
                </div>
              </div>

              {/* پیام پاورقی */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                {settings.invoice_footer_note}
              </div>
            </div>
          ) : (
            /* =================== فرمت فاکتور رسمی A5 =================== */
            <div
              id="printable-invoice"
              className="w-[520px] bg-white text-black p-8 shadow-lg border border-slate-300 font-sans text-xs leading-relaxed"
            >
              {/* سربرگ رسمی */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold">{settings.name}</h2>
                  <div className="text-[11px] text-slate-600 mt-1">تلفن: {settings.phone}</div>
                  <div className="text-[11px] text-slate-600">{settings.address}</div>
                </div>
                <div className="text-left text-xs space-y-1">
                  <div className="font-bold text-sm text-blue-700">فاکتور خدمات رایانه‌ای</div>
                  <div>شماره: <span className="font-bold">{invoice.invoice_number}</span></div>
                  <div>تاریخ: <span>{formatJalaliDateTime(invoice.created_at)}</span></div>
                </div>
              </div>

              {/* کادر مشخصات خریدار */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mb-4 flex justify-between text-xs">
                <div>مشتری گرامی: <strong className="mr-1">{invoice.customer_name || 'عمومی'}</strong></div>
                <div>شماره تماس: <span className="mr-1">{invoice.customer_phone || '-'}</span></div>
                <div>متصدی: <span className="mr-1">{invoice.user_name || '-'}</span></div>
              </div>

              {/* جدول اقلام */}
              <table className="w-full text-right text-xs border border-collapse border-slate-300 mb-4">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300 text-center w-10">ردیف</th>
                    <th className="p-2 border-l border-slate-300">شرح خدمت / کالا</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">تعداد</th>
                    <th className="p-2 border-l border-slate-300 text-center w-24">قیمت واحد</th>
                    <th className="p-2 text-center w-28">مبلغ کل (تومان)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-l border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-200">{item.service_title}</td>
                      <td className="p-2 border-l border-slate-200 text-center">{item.quantity}</td>
                      <td className="p-2 border-l border-slate-200 text-center">{formatToman(item.unit_price)}</td>
                      <td className="p-2 text-center font-bold">{formatToman(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* جمع مبالغ و امضا */}
              <div className="flex justify-between items-start mt-4">
                <div className="w-1/2 text-[10px] text-slate-500 space-y-4">
                  <p>{settings.invoice_footer_note}</p>
                  <div className="pt-6">مهر و امضای کافی‌نت: ............................</div>
                </div>

                <div className="w-5/12 bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>جمع کل:</span>
                    <span>{formatToman(invoice.total_amount)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>تخفیف:</span>
                      <span>{formatToman(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                    <span>مبلغ نهایی:</span>
                    <span>{formatToman(invoice.final_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>روش پرداخت:</span>
                    <span className="font-semibold">{invoice.payment_method === 'cash' ? 'نقدی' : 'دستگاه کارتخوان'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
