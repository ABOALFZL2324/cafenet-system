import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { exportDatabaseBackup, restoreDatabaseBackup } from '../../utils/storage';
import {
  isClientMode,
  getServerBaseUrl,
  setNetworkRoleConfig,
  fetchLocalNetworkInfo,
  testServerConnection,
  NetworkInfoResponse,
} from '../../utils/network';
import {
  Settings,
  Save,
  Download,
  Upload,
  ShieldCheck,
  Database,
  Image,
  Trash2,
  Wifi,
  Server,
  Laptop,
  Check,
  Copy,
  RefreshCw,
  Globe,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData } = useData();

  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logo_url);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoice_footer_note);
  const [settlementModel, setSettlementModel] = useState(settings.default_settlement_model);
  const [employerPercentage, setEmployerPercentage] = useState<number>(
    settings.default_employer_percentage ?? 50
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string>('');

  // استیت‌های شبکه محلی (LAN Sync)
  const clientModeActive = isClientMode();
  const currentRemoteHost = getServerBaseUrl();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);
  const [copiedIp, setCopiedIp] = useState(false);
  const [newRemoteHost, setNewRemoteHost] = useState(currentRemoteHost);
  const [netTestResult, setNetTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingNet, setIsTestingNet] = useState(false);

  useEffect(() => {
    fetchLocalNetworkInfo().then((info) => {
      if (info) setNetworkInfo(info);
    });
  }, []);

  const handleCopyServerIp = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleSwitchToClient = async () => {
    if (!newRemoteHost.trim()) {
      alert('لطفاً آدرس IP سیستم اصلی را وارد کنید.');
      return;
    }
    setIsTestingNet(true);
    const res = await testServerConnection(newRemoteHost);
    setIsTestingNet(false);
    setNetTestResult(res);

    if (res.success) {
      setNetworkRoleConfig('client', newRemoteHost);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleSwitchToServer = () => {
    if (confirm('آیا می‌خواهید این سیستم را به عنوان سیستم اصلی (سرور دیتابیس محلی) تنظیم کنید؟')) {
      setNetworkRoleConfig('server');
      window.location.reload();
    }
  };

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
      default_employer_percentage: employerPercentage,
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
    <div className="space-y-4 text-right max-w-4xl no-print pb-10">
      <div className="bg-white dark:bg-[#202024] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          تنظیمات عمومی، اتصال شبکه محلی (LAN) و پشتیبان‌گیری
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          مدیریت اتصال چند سیستمی به یک مودم، شخصی‌سازی لوگو و خروجی دیتابیس
        </p>
      </div>

      {/* ================= بخش شبکه محلی و اتصال چند سیستمی ================= */}
      <div className="bg-white dark:bg-[#202024] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-black text-slate-800 dark:text-white">
              پیکربندی شبکه محلی (اتصال همزمان چند کامپیوتر به یک دیتابیس)
            </h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
              clientModeActive
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
            }`}
          >
            {clientModeActive ? 'حالت: سیستم متصل (کلاینت)' : 'حالت: سیستم اصلی (سرور دیتابیس)'}
          </span>
        </div>

        {!clientModeActive ? (
          /* در حالت سیستم اصلی */
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              این کامپیوتر به عنوان <strong>سیستم اصلی مغازه</strong> فعالیت می‌کند. برای اینکه کامپیوتر دوم (یا لپ‌تاپ همکار) به این سیستم وصل شود، کافی است در برنامه کامپیوتر دوم آدرس زیر را وارد کنید:
            </p>

            {networkInfo && networkInfo.ips && networkInfo.ips.length > 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700 dark:text-zinc-300">آدرس آی‌پی سیستم اصلی در شبکه:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm bg-white dark:bg-zinc-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-zinc-700" dir="ltr">
                    {networkInfo.primaryIp}:{networkInfo.port}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyServerIp(`${networkInfo.primaryIp}:${networkInfo.port}`)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors shrink-0"
                >
                  {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIp ? 'کپی شد!' : 'کپی آدرس شبکه'}</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                در حال دریافت اطلاعات کارت شبکه... (اطمینان حاصل کنید کامپیوتر به مودم متصل است)
              </div>
            )}
          </div>
        ) : (
          /* در حالت کلاینت سیستم دوم */
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              این سیستم در حال حاضر به عنوان <strong>سیستم متصل همکار</strong> کار می‌کند و کلیه فاکتورها و عملیات مالی را از سیستم اصلی دریافت و همگام می‌کند.
            </p>
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900 dark:text-purple-200">سیستم اصلی متصل:</span>
              <span className="font-mono font-black text-purple-700 dark:text-purple-300" dir="ltr">
                {currentRemoteHost}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSwitchToServer}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              تغییر این سیستم به سیستم اصلی مستقل
            </button>
          </div>
        )}
      </div>

      {/* فرم مشخصات مغازه */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#202024] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 pb-2 border-b border-slate-100 dark:border-zinc-800">
          مشخصات کسب‌وکار و لوگوی فاکتور
        </h3>

        {/* بخش آپلود لوگوی کافی‌نت */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {logoUrl ? (
              <img src={logoUrl} alt="لوگوی کافی‌نت" className="w-full h-full object-contain p-1" />
            ) : (
              <Image className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
            )}
          </div>

          <div className="flex-1 text-right">
            <div className="text-xs font-bold text-slate-800 dark:text-white">تصویر لوگو یا مهر کافی‌نت</div>
            <div className="text-[11px] text-slate-400 mt-0.5 mb-2">
              این تصویر در بالای فاکتورهای چاپی مشتریان قرار خواهد گرفت. (فرمت PNG یا JPG تا حداکثر ۲ مگابایت)
            </div>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors">
                <span>انتخاب لوگو از سیستم</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                >
                  حذف لوگو
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              نام رسمی کافی‌نت / مرکز خدمات:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              تلفن تماس فروشگاه:
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
          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
            آدرس پستی مغازه:
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
            متن پاورقی فاکتور مشتریان:
          </label>
          <input
            type="text"
            value={invoiceFooter}
            onChange={(e) => setInvoiceFooter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
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
      <div className="bg-white dark:bg-[#202024] p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            پشتیبان‌گیری (Backup) و بازیابی اطلاعات پایگاه‌داده
          </h3>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
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

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
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

      {/* بخش بازنشانی به حالت خام کارخانه */}
      <div className="bg-white dark:bg-[#202024] p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400">
          بازنشانی به حالت خام کارخانه (راه‌اندازی اولیه مجدد)
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
          در صورتی که می‌خواهید اطلاعات تستی را پاک کرده و برنامه را از صفر ویزاردی با مشخصات جدید و فایل اکسل تازه راه‌اندازی کنید، از این گزینه استفاده کنید.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('هشدار: آیا مطمئن هستید؟ تمامی داده‌ها پاک شده و ویزارد راه‌اندازی اولیه از ابتدا اجرا خواهد شد.')) {
              localStorage.clear();
              fetch('/api/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  users: [],
                  shifts: [],
                  serviceCategories: [],
                  services: [],
                  invoices: [],
                  expenses: [],
                  pendingOrders: [],
                  settlements: [],
                  settings: {
                    name: '',
                    phone: '',
                    address: '',
                    invoice_footer_note: 'با تشکر از اعتماد شما',
                    default_settlement_model: 'total_share',
                    is_initialized: false,
                  },
                }),
              }).finally(() => {
                window.location.reload();
              });
            }
          }}
          className="px-4 py-2 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all"
        >
          پاکسازی و ریست سیستم به حالت خام کارخانه
        </button>
      </div>
    </div>
  );
};
