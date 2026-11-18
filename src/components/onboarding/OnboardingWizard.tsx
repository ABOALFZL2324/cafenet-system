import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { downloadServicesTemplateExcel, parseServicesExcelFile, ParsedExcelService } from '../../utils/exportExcel';
import { formatToman } from '../../utils/currency';
import {
  setNetworkRoleConfig,
  testServerConnection,
  fetchLocalNetworkInfo,
  NetworkInfoResponse,
} from '../../utils/network';
import {
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  AlertCircle,
  HelpCircle,
  Server,
  Laptop,
  Wifi,
  RefreshCw,
  Globe,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { setupInitialSystem, refreshData } = useData();

  // نقش سیستم: انتخاب نشده (select) | سیستم اصلی (server) | سیستم متصل دوم (client)
  const [roleMode, setRoleMode] = useState<'select' | 'server' | 'client'>('select');

  // شماره مرحله فعلی (در حالت سرور) (1: مشخصات و مدیر | 2: اکسل خدمات | 3: تبریک و پایان)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // استیت‌های کلاینت شبکه
  const [remoteHostInput, setRemoteHostInput] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  // مشخصات شبکه سیستم فعلی
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);

  // گام ۱: مشخصات کافی‌نت
  const [cafeName, setCafeName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // مشخصات صاحب کافی‌نت (مدیر)
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPin, setAdminPin] = useState('1234');
  const [adminProfit, setAdminProfit] = useState(100);

  // اپراتورهای اولیه (اختیاری)
  const [operators, setOperators] = useState<
    { full_name: string; username: string; pin_code: string; profit_percentage: number }[]
  >([]);
  const [newOpName, setNewOpName] = useState('');
  const [newOpUsername, setNewOpUsername] = useState('');
  const [newOpPin, setNewOpPin] = useState('');
  const [newOpProfit, setNewOpProfit] = useState(30);
  const [showAddOp, setShowAddOp] = useState(false);

  // گام ۲: اکسل خدمات
  const [servicesList, setServicesList] = useState<ParsedExcelService[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [excelError, setExcelError] = useState<string>('');
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  // پیام خطای عمومی فرم
  const [stepError, setStepError] = useState('');

  useEffect(() => {
    fetchLocalNetworkInfo().then((info) => {
      if (info) {
        setNetworkInfo(info);
      }
    });
  }, []);

  // افزودن اپراتور اولیه به لیست
  const handleAddOperator = () => {
    if (!newOpName.trim() || !newOpUsername.trim() || !newOpPin.trim()) {
      alert('لطفاً نام، نام کاربری و پین‌کد همکار را وارد کنید.');
      return;
    }
    setOperators([
      ...operators,
      {
        full_name: newOpName.trim(),
        username: newOpUsername.trim().toLowerCase(),
        pin_code: newOpPin.trim(),
        profit_percentage: newOpProfit,
      },
    ]);
    setNewOpName('');
    setNewOpUsername('');
    setNewOpPin('');
    setNewOpProfit(30);
    setShowAddOp(false);
  };

  const handleRemoveOperator = (idx: number) => {
    setOperators(operators.filter((_, i) => i !== idx));
  };

  // آپلود و پردازش فایل اکسل
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelError('');

    try {
      const parsed = await parseServicesExcelFile(file);
      setServicesList(parsed);
      setExcelFileName(file.name);
    } catch (err: any) {
      setExcelError(err.message || 'خطا در خواندن فایل اکسل. لطفاً ساختار فایل را بررسی کنید.');
      setServicesList([]);
      setExcelFileName('');
    } finally {
      setIsParsingExcel(false);
    }
  };

  // بارگذاری خدمات پیشنهادی
  const handleLoadSampleServices = () => {
    const samples: ParsedExcelService[] = [
      { category: 'چاپ و تکثیر', title: 'پرینت تک‌رو سیاه سفید (A4)', unit_price: 3000 },
      { category: 'چاپ و تکثیر', title: 'پرینت دورو سیاه سفید (A4)', unit_price: 5000 },
      { category: 'چاپ و تکثیر', title: 'پرینت رنگی (A4)', unit_price: 15000 },
      { category: 'چاپ و تکثیر', title: 'اسکن مدارک و اسناد (هر برگ)', unit_price: 5000 },
      { category: 'ثبت‌نام‌های اینترنتی', title: 'ثبت‌نام آزمون کنکور سراسری', unit_price: 100000 },
      { category: 'ثبت‌نام‌های اینترنتی', title: 'ثبت‌نام قرعه‌کشی خودرو', unit_price: 150000 },
      { category: 'خدمات مالیاتی و بیمه', title: 'ارسال اظهارنامه مالیاتی مشاغل', unit_price: 250000 },
      { category: 'خدمات مالیاتی و بیمه', title: 'صدور فیش بیمه تامین اجتماعی', unit_price: 30000 },
      { category: 'خدمات قضایی و انتظامی', title: 'ثبت‌نام سامانه ثنا و احراز هویت', unit_price: 80000 },
      { category: 'خدمات قضایی و انتظامی', title: 'استعلام خلافی خودرو و پرداخت', unit_price: 35000 },
      { category: 'تایپ و صحافی', title: 'تایپ فارسی هر صفحه استاندارد', unit_price: 25000 },
      { category: 'تایپ و صحافی', title: 'صحافی فنری با طلق (تا ۵۰ برگ)', unit_price: 40000 },
    ];
    setServicesList(samples);
    setExcelFileName('تعرفه‌های پیشنهادی استاندارد صنف کافی‌نت');
    setExcelError('');
  };

  const handleSelectServerMode = () => {
    setNetworkRoleConfig('server');
    setRoleMode('server');
  };

  const handleSelectClientMode = () => {
    setRoleMode('client');
  };

  // تست ارتباط و اتصال سیستم دوم به سیستم اصلی
  const handleTestAndConnectClient = async () => {
    if (!remoteHostInput.trim()) {
      setConnectionResult({ success: false, message: 'لطفاً آدرس IP سیستم اصلی را وارد کنید.' });
      return;
    }

    setIsTestingConnection(true);
    setConnectionResult(null);

    const res = await testServerConnection(remoteHostInput);
    setIsTestingConnection(false);
    setConnectionResult(res);

    if (res.success) {
      setNetworkRoleConfig('client', remoteHostInput);
      setTimeout(() => {
        // بازخوانی اطلاعات از سرور اصلی و بارگذاری سیستم
        window.location.reload();
      }, 1200);
    }
  };

  // رفتن به مرحله ۲
  const handleGoToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeName.trim()) {
      setStepError('لطفاً نام کافی‌نت خود را وارد کنید.');
      return;
    }
    if (!adminName.trim()) {
      setStepError('لطفاً نام و نام خانوادگی مدیر را وارد کنید.');
      return;
    }
    if (!adminPin || adminPin.length < 4) {
      setStepError('پین‌کد ورود مدیر باید حداقل ۴ رقم باشد.');
      return;
    }

    setStepError('');
    setStep(2);
  };

  // نهایی‌سازی و رفتن به مرحله ۳
  const handleFinalizeSetup = () => {
    if (servicesList.length === 0) {
      setExcelError('لطفاً فایل اکسل تعرفه‌ها را بارگذاری کنید یا دکمه «استفاده از لیست پیش‌فرض» را بزنید.');
      return;
    }

    setupInitialSystem({
      cafeName: cafeName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      adminUser: {
        full_name: adminName.trim(),
        username: adminUsername.trim().toLowerCase() || 'admin',
        pin_code: adminPin.trim(),
        profit_percentage: adminProfit,
      },
      operators: operators.map((op) => ({
        ...op,
        role: 'operator',
        is_active: true,
      })),
      services: servicesList,
    });

    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white/95 dark:bg-[#202024]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden text-right">
        {/* ================= صفحه ۰: انتخاب نقش سیستم در شبکه محلی ================= */}
        {roleMode === 'select' && (
          <div className="p-7 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
                <Wifi className="w-8 h-8" />
              </div>
              <h1 className="text-lg font-black text-slate-800 dark:text-white">
                پیکربندی هوشمند شبکه و نقش این کامپیوتر
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                این نرم‌افزار از شبکه محلی (LAN) پشتیبانی می‌کند تا چند سیستم در کافی‌نت به صورت همزمان به یک دیتابیس مشترک متصل شوند. نقش این سیستم را مشخص فرمایید:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* گزینه ۱: سیستم اصلی (سرور) */}
              <button
                type="button"
                onClick={handleSelectServerMode}
                className="p-5 rounded-3xl border-2 border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-right flex flex-col justify-between group active:scale-[0.98] shadow-xs bg-white dark:bg-zinc-850"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                    <Server className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span>۱. این سیستم اصلی است (سرور مرکزی)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    بانک اطلاعاتی و دخل مغازه روی همین کامپیوتر ذخیره می‌شود و سیستم‌های دیگر همکاران به این کامپیوتر متصل خواهند شد.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>راه‌اندازی به عنوان سیستم اصلی</span>
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                </div>
              </button>

              {/* گزینه ۲: سیستم متصل همکار (کلاینت) */}
              <button
                type="button"
                onClick={handleSelectClientMode}
                className="p-5 rounded-3xl border-2 border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all text-right flex flex-col justify-between group active:scale-[0.98] shadow-xs bg-white dark:bg-zinc-850"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span>۲. سیستم دوم / همکار (متصل به اصلی)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    سیستم اصلی را قبلاً راه‌اندازی کرده‌اید و می‌خواهید این کامپیوتر بدون نیاز به ورود دوباره اطلاعات، به آن متصل شده و همگام کار کند.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>اتصال به سیستم اصلی</span>
                  <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* آدرس شبکه این سیستم در صورت نیاز به بررسی */}
            {networkInfo && networkInfo.primaryIp && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  آدرس IP این سیستم در مودم مغازه:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-white bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-lg" dir="ltr">
                  {networkInfo.primaryIp}:{networkInfo.port}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= صفحه اتصال سیستم دوم (Client Connect) ================= */}
        {roleMode === 'client' && (
          <div className="p-7 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-white">
                    اتصال به سیستم اصلی کافی‌نت (شبکه محلی)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    برای کارکرد همزمان دو کامپیوتر، آدرس شبکه کامپیوتر اصلی را وارد نمایید.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleMode('select')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
              >
                بازگشت
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1.5">
                  آدرس IP یا نام کامپیوتر اصلی مغازه:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: 192.168.1.100 یا 192.168.1.5"
                    value={remoteHostInput}
                    onChange={(e) => setRemoteHostInput(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  نکته: در سیستم اصلی کافی‌نت، آدرس IP سیستم در منوی «تنظیمات و شبکه» یا در اولین مرحله ویزارد نمایش داده شده است.
                </p>
              </div>

              {connectionResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    connectionResult.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {connectionResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{connectionResult.message}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isTestingConnection}
                  onClick={handleTestAndConnectClient}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال بررسی ارتباط شبکه...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>برقراری اتصال و شروع به کار</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= مراحل راه‌اندازی در حالت سرور اصلی ================= */}
        {roleMode === 'server' && (
          <div>
            {/* هدر ویزارد با نوار پیشرفت ۳ مرحله‌ای */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-850/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <span>راه‌اندازی سیستم اصلی و پایگاه داده کافی‌نت</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.2 rounded-full font-bold">
                        سرور مرکزی
                      </span>
                    </h1>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                      تعریف مشخصات مدیر، پرسنل و بارگذاری نرخ‌نامه خدمات از اکسل
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800/50">
                  مرحله {step} از ۳
                </div>
              </div>

              {/* استپ‌بار بصری */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`} />
                <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`} />
                <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`} />
              </div>
            </div>

            {/* محتوای مرحله ۱: مشخصات کافی‌نت و مدیر */}
            {step === 1 && (
              <form onSubmit={handleGoToStep2} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {stepError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stepError}</span>
                  </div>
                )}

                {/* بخش ۱: مشخصات کافی‌نت */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-zinc-700">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    ۱. مشخصات کسب‌وکار و تابلوی مغازه
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        نام کافی‌نت / مرکز خدمات: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثلا: کافی‌نت عصر نوین"
                        value={cafeName}
                        onChange={(e) => setCafeName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        شماره تلفن مغازه:
                      </label>
                      <input
                        type="text"
                        placeholder="۰۲۱-۸۸۸۸۸۸۸۸"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      آدرس مغازه (جهت چاپ در سربرگ فاکتور):
                    </label>
                    <input
                      type="text"
                      placeholder="تهران، خیابان آزادی، نبش کوچه ..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                    />
                  </div>
                </div>

                {/* بخش ۲: مدیر ارشد */}
                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-zinc-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ۲. حساب کاربری صاحب کافی‌نت (مدیر سیستم)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        نام و نام خانوادگی مدیر: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثلا: علی رضایی"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        نام کاربری انگلیسی:
                      </label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        پین‌کد ورود (۴ رقم): <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-center font-bold tracking-widest"
                      />
                    </div>
                  </div>
                </div>

                {/* بخش ۳: همکاران / اپراتورها (اختیاری) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-700">
                    <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      ۳. تعریف همکاران و اپراتورهای شیفت (اختیاری)
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowAddOp(!showAddOp)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      افزودن همکار
                    </button>
                  </div>

                  {showAddOp && (
                    <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="نام و نام خانوادگی همکار"
                          value={newOpName}
                          onChange={(e) => setNewOpName(e.target.value)}
                          className="h-9 px-3 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="نام کاربری (انگلیسی)"
                          value={newOpUsername}
                          onChange={(e) => setNewOpUsername(e.target.value)}
                          className="h-9 px-3 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs text-left font-mono"
                          dir="ltr"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="پین‌کد (۴ رقم)"
                          value={newOpPin}
                          onChange={(e) => setNewOpPin(e.target.value)}
                          className="h-9 px-3 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs text-center font-bold"
                        />
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="درصد سهم"
                            value={newOpProfit}
                            onChange={(e) => setNewOpProfit(parseInt(e.target.value) || 0)}
                            className="w-20 h-9 px-2 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleAddOperator}
                            className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                          >
                            ثبت
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {operators.length > 0 && (
                    <div className="space-y-1.5">
                      {operators.map((op, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white">{op.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({op.username})</span>
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                              سهم: {op.profit_percentage}٪
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOperator(idx)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setRoleMode('select')}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                  >
                    تغییر نقش سیستم
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>مرحله بعدی: بارگذاری نرخ‌نامه خدمات با اکسل</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* مرحله ۲: اکسل خدمات */}
            {step === 2 && (
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    بارگذاری نرخ‌نامه و تعرفه خدمات کافی‌نت
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    می‌توانید فایل اکسل نرخ‌نامه خود را بارگذاری کنید یا از تعرفه‌های استاندارد پیش‌فرض صنف کافی‌نت استفاده نمایید.
                  </p>
                </div>

                {excelError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{excelError}</span>
                  </div>
                )}

                {/* دو دکمه اصلی انتخاب اکسل یا نمونه */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 cursor-pointer flex flex-col items-center justify-center text-center group transition-all">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                      انتخاب و آپلود فایل اکسل (.xlsx)
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                      نرخ‌نامه دلخواه شما بارگذاری می‌شود
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSampleServices}
                    className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50/50 dark:bg-zinc-850 cursor-pointer flex flex-col items-center justify-center text-center group transition-all"
                  >
                    <Sparkles className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">
                      استفاده از لیست تعرفه‌های پیشنهادی صنف
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      پرینت، ثبت‌نام‌ها، مالیات و بیمه (قابل ویرایش)
                    </span>
                  </button>
                </div>

                {/* پیش‌نمایش اقلام بارگذاری شده */}
                {servicesList.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-200">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {servicesList.length} خدمت با موفقیت آماده شد ({excelFileName})
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {servicesList.slice(0, 10).map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex justify-between text-xs"
                        >
                          <span className="text-slate-800 dark:text-white font-medium">{s.title}</span>
                          <span className="text-emerald-600 font-black">{formatToman(s.unit_price)}</span>
                        </div>
                      ))}
                      {servicesList.length > 10 && (
                        <div className="text-center text-[11px] text-slate-400 pt-1">
                          و {servicesList.length - 10} خدمت دیگر...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    بازگشت به مرحله قبل
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizeSetup}
                    disabled={servicesList.length === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>تکمیل راه‌اندازی و ورود به نرم‌افزار</span>
                  </button>
                </div>
              </div>
            )}

            {/* مرحله ۳: تبریک و پایان */}
            {step === 3 && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-base font-black text-slate-800 dark:text-white">
                  راه‌اندازی با موفقیت انجام شد!
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  سیستم اصلی کافی‌نت شما با موفقیت آماده به کار شد. دیتابیس فعال است و پورت شبکه محلی برای اتصال سیستم‌های دیگر همکاران باز است.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    ورود به پنل اصلی کافی‌نت
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
