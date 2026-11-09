import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { exportDatabaseBackup, restoreDatabaseBackup } from '../../utils/storage';
import { Settings, Save, Download, Upload, ShieldCheck, Database } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData } = useData();

  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoice_footer_note);
  const [settlementModel, setSettlementModel] = useState(settings.default_settlement_model);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
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
    <div className="space-y-4 text-right max-w-4xl">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          تنظیمات عمومی کافی‌نت و پشتیبان‌گیری
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          شخصی‌سازی نام و سربرگ فاکتورها، مدل پیش‌فرض مالی و پشتیبان‌گیری از داده‌ها
        </p>
      </div>

      {/* فرم مشخصات مغازه */}
      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-zinc-750">
          مشخصات کسب‌وکار (نمایش در سربرگ فاکتور مشتری و اسناد تسویه)
        </h3>

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
