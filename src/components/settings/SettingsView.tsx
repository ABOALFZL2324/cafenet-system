import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { exportDatabaseBackup, restoreDatabaseBackup } from '../../utils/storage';
import { Settings, Save, Download, Upload, ShieldCheck, Database, Image, Trash2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData } = useData();

  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logo_url);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoice_footer_note);
  const [settlementModel, setSettlementModel] = useState(settings.default_settlement_model);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');

  // آپلود تصویر لوگو و تبدیل به Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم تصویر لوگو باید کمتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      logo_url: logoUrl,
      invoice_footer_note: invoiceFooter.trim(),
      default_settlement_model: settlementModel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoreStatus('در حال بررسی و بازیابی اطلاعات...');
      await restoreDatabaseBackup(file);
      refreshData();
      setRestoreStatus('بازیابی دیتابیس با موفقیت انجام شد و اطلاعات جایگزین گردید.');
      setTimeout(() => setRestoreStatus(''), 4000);
    } catch (err: any) {
      setRestoreStatus('خطا در بازیابی: فایل پشتیبان معتبر نیست.');
    }
  };

  return (
    <div className="space-y-4 text-right max-w-4xl no-print">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          تنظیمات عمومی، لوگوی کافی‌نت و پشتیبان‌گیری
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          شخصی‌سازی نام و لوگوی فاکتورها، مدل پیش‌فرض مالی و پشتیبان‌گیری از داده‌ها
        </p>
      </div>

      {/* فرم مشخصات مغازه */}
      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-zinc-750">
          مشخصات کسب‌وکار و لوگوی فاکتور
        </h3>

        {/* بخش آپلود لوگوی کافی‌نت */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="لوگوی کافی‌نت" className="w-full h-full object-contain p-1" />
            ) : (
              <Image className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
            )}
          </div>

          <div className="flex-1 text-right">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              تصویر لوگوی اختصاصی کافی‌نت (برای سربرگ فاکتور حرارتی و A5)
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              فرمت‌های PNG یا JPG ترجیحاً با زمینه شفاف یا سفید
            </p>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-bold cursor-pointer transition-colors">
                انتخاب و آپلود لوگو
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف لوگو
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نام رسمی کافی‌نت / مرکز خدمات:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              شماره تلفن مغازه:
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            آدرس کامل کافی‌نت:
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            متن پیام تشکر و شرایط در پاورقی فاکتور مشتری:
          </label>
          <textarea
            rows={2}
            value={invoiceFooter}
            onChange={(e) => setInvoiceFooter(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            مدل پیش‌فرض محاسبه سود پرسنل:
          </label>
          <select
            value={settlementModel}
            onChange={(e) => setSettlementModel(e.target.value as any)}
            className="w-full sm:w-80 h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-bold"
          >
            <option value="total_share">مدل شراکتی (درصد از سود خالص کل)</option>
            <option value="individual_performance">مدل پورسانت عملکردی فردی (با تسهیم هزینه)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            ذخیره تغییرات تنظیمات
          </button>
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold">
              ✓ تنظیمات با موفقیت ذخیره شد.
            </span>
          )}
        </div>
      </form>

      {/* بخش پشتیبان‌گیری و بازیابی داده‌ها */}
      <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-750">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            پشتیبان‌گیری (Backup) و بازیابی اطلاعات پایگاه‌داده
          </h3>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          برای حفظ امنیت اطلاعات حساب‌کتاب چندماهه، پیشنهاد می‌شود به صورت هفتگی از دیتابیس نرم‌افزار خروجی بگیرید و روی فلش‌مموری یا درایو دیگری ذخیره نمایید.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={exportDatabaseBackup}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            دانلود فایل پشتیبان کامل دیتابیس (.json)
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>بازیابی دیتابیس از فایل پشتیبان</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>

        {restoreStatus && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            {restoreStatus}
          </div>
        )}
      </div>
    </div>
  );
};
