import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { Printer, X, Receipt, FileText } from 'lucide-react';

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

  // تابع چاپ ایزوله و مستقل (فقط فاکتور چاپ می‌شود، نه صفحه برنامه!)
  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>فاکتور ${invoice.invoice_number}</title>
          <style>
            @page { margin: ${printFormat === 'thermal' ? '0' : '10mm'}; size: ${printFormat === 'thermal' ? '80mm auto' : 'A5 portrait'}; }
            body {
              font-family: 'Vazirmatn', Tahoma, 'Segoe UI', sans-serif;
              direction: rtl;
              margin: 0;
              padding: ${printFormat === 'thermal' ? '8px' : '15px'};
              color: #000;
              background: #fff;
              font-size: ${printFormat === 'thermal' ? '12px' : '13px'};
              line-height: 1.5;
            }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; align-items: center; }
            .border-b-dashed { border-bottom: 1px dashed #666; padding-bottom: 6px; margin-bottom: 6px; }
            .border-b-double { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; }
            th, td { padding: 4px 2px; }
            .table-a5 th, .table-a5 td { border: 1px solid #999; padding: 6px 4px; text-align: center; }
            .logo-img { max-height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 no-print">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 flex flex-col max-h-[92vh] overflow-hidden text-right">
        {/* نوار ابزار بالا */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">قطع چاپ:</span>
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
                فیش حرارتی (۸ سانت)
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              چاپ فاکتور (تک‌برگ)
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
              className="w-[300px] bg-white text-black p-4 shadow-lg border border-slate-200 text-center font-sans text-xs leading-relaxed"
            >
              {/* لوگوی کافی‌نت اگر وجود داشته باشد */}
              {settings.logo_url && (
                <div className="text-center mb-1">
                  <img src={settings.logo_url} alt="لوگو" className="logo-img mx-auto max-h-12 object-contain" />
                </div>
              )}

              {/* سربرگ */}
              <div className="border-b-double pb-2 mb-2 text-center">
                <h3 className="font-bold text-sm tracking-wide">{settings.name}</h3>
                <div className="text-[11px] text-slate-600 mt-0.5">تلفن: {settings.phone}</div>
                {settings.address && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{settings.address}</div>
                )}
              </div>

              {/* مشخصات فاکتور */}
              <div className="text-[11px] space-y-1 text-right border-b-dashed pb-2 mb-2">
                <div className="flex-between">
                  <span>شماره فاکتور:</span>
                  <span className="font-bold">{invoice.invoice_number}</span>
                </div>
                <div className="flex-between">
                  <span>تاریخ و ساعت:</span>
                  <span>{formatJalaliDateTime(invoice.created_at)}</span>
                </div>
                <div className="flex-between">
                  <span>متصدی:</span>
                  <span>{invoice.user_name || 'اپراتور'}</span>
                </div>
                {invoice.customer_name && (
                  <div className="flex-between">
                    <span>مشتری:</span>
                    <span className="font-bold">{invoice.customer_name}</span>
                  </div>
                )}
              </div>

              {/* جدول اقلام */}
              <table className="w-full text-right text-[11px] my-2">
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>شرح خدمت</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px' }}>تعداد</th>
                    <th style={{ textAlign: 'left', paddingBottom: '4px' }}>مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                      <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.service_title}</td>
                      <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'left', padding: '4px 0' }} className="font-bold">
                        {formatToman(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* جمع مبالغ */}
              <div className="border-t-2 border-dashed border-slate-400 pt-2 space-y-1 text-right text-xs">
                <div className="flex-between">
                  <span>جمع کل خدمات:</span>
                  <span>{formatToman(invoice.total_amount)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex-between" style={{ color: '#c00' }}>
                    <span>تخفیف:</span>
                    <span>{formatToman(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex-between font-bold text-sm pt-1" style={{ borderTop: '1px solid #000' }}>
                  <span>مبلغ پرداختی:</span>
                  <span>{formatToman(invoice.final_amount)}</span>
                </div>
                <div className="flex-between text-[11px] text-slate-500 pt-0.5">
                  <span>روش پرداخت:</span>
                  <span className="font-bold">{invoice.payment_method === 'cash' ? 'نقدی' : 'کارتخوان'}</span>
                </div>
              </div>

              {/* پیام پاورقی */}
              <div className="mt-3 pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300 text-center">
                {settings.invoice_footer_note}
              </div>
            </div>
          ) : (
            /* =================== فرمت فاکتور رسمی A5 =================== */
            <div
              id="printable-invoice"
              className="w-[520px] bg-white text-black p-7 shadow-lg border border-slate-300 font-sans text-xs leading-relaxed"
            >
              {/* سربرگ رسمی با لوگو */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="لوگو" className="logo-img max-h-12 object-contain" />
                  )}
                  <div>
                    <h2 className="text-base font-bold">{settings.name}</h2>
                    <div className="text-[11px] text-slate-600">تلفن: {settings.phone}</div>
                    {settings.address && (
                      <div className="text-[10px] text-slate-500">{settings.address}</div>
                    )}
                  </div>
                </div>
                <div className="text-left text-xs space-y-1">
                  <div className="font-bold text-sm text-blue-800">فاکتور خدمات کامپیوتری</div>
                  <div>شماره: <span className="font-bold">{invoice.invoice_number}</span></div>
                  <div>تاریخ: <span>{formatJalaliDateTime(invoice.created_at)}</span></div>
                </div>
              </div>

              {/* کادر مشخصات خریدار */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3 flex justify-between text-xs">
                <div>مشتری گرامی: <strong className="mr-1">{invoice.customer_name || 'عمومی'}</strong></div>
                <div>شماره تماس: <span className="mr-1">{invoice.customer_phone || '-'}</span></div>
                <div>متصدی: <span className="mr-1">{invoice.user_name || '-'}</span></div>
              </div>

              {/* جدول اقلام */}
              <table className="table-a5 w-full text-right text-xs mb-3 border border-collapse border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th style={{ width: '35px' }}>ردیف</th>
                    <th>شرح خدمت / کالا</th>
                    <th style={{ width: '45px' }}>تعداد</th>
                    <th style={{ width: '85px' }}>قیمت واحد</th>
                    <th style={{ width: '95px' }}>مبلغ کل</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ textAlign: 'right', paddingRight: '6px' }}>{item.service_title}</td>
                      <td>{item.quantity}</td>
                      <td>{formatToman(item.unit_price)}</td>
                      <td className="font-bold">{formatToman(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* جمع مبالغ و امضا */}
              <div className="flex justify-between items-start mt-3">
                <div className="w-1/2 text-[10px] text-slate-500 space-y-3">
                  <p>{settings.invoice_footer_note}</p>
                  <div className="pt-4">مهر و امضای فروشگاه: .........................</div>
                </div>

                <div className="w-5/12 bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-xs">
                  <div className="flex-between">
                    <span>جمع کل:</span>
                    <span>{formatToman(invoice.total_amount)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex-between text-rose-600">
                      <span>تخفیف:</span>
                      <span>{formatToman(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex-between font-bold text-sm pt-1 border-t border-slate-300">
                    <span>مبلغ نهایی:</span>
                    <span>{formatToman(invoice.final_amount)}</span>
                  </div>
                  <div className="flex-between text-[11px] text-slate-500 pt-0.5">
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
