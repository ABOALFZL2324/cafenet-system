import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { downloadServicesTemplateExcel, parseServicesExcelFile, ParsedExcelService } from '../../utils/exportExcel';
import { formatToman } from '../../utils/currency';
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
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { setupInitialSystem } = useData();

  // شماره مرحله فعلی (1: مشخصات و مدیر | 2: اکسل خدمات | 3: تبریک و پایان)
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // بارگذاری خدمات پیشنهادی (در صورت عدم تمایل به استفاده از اکسل در این لحظه)
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
      <div className="w-full max-w-3xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-700/80 overflow-hidden text-right">
        {/* هدر ویزارد با نوار پیشرفت ۳ مرحله‌ای */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-850/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-800 dark:text-slate-100">
                  راه‌اندازی اولیه و آماده‌سازی سیستم کافی‌نت
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  تعریف مدیر، همکاران و بارگذاری آسان نرخ‌نامه از فایل اکسل
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

        {/* محتوای مرحله ۱: مشخصات کافی‌نت و صاحب مغازه */}
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

            {/* بخش ۲: مدیر ارشد (صاحب کافی‌نت) */}
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
                  <Users className="w-4 h-4 text-blue-600" />
                  ۳. تعریف همکاران و اپراتورهای شیفت (اختیاری)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddOp(!showAddOp)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن همکار
                </button>
              </div>

              {/* فرم موقت افزودن همکار */}
              {showAddOp && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="نام همکار (مثلا: محمدی)"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="نام کاربری (mohammadi)"
                      value={newOpUsername}
                      onChange={(e) => setNewOpUsername(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-left font-mono"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="پین‌کد (مثلا: 1111)"
                      value={newOpPin}
                      onChange={(e) => setNewOpPin(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-center font-bold"
                    />
                    <input
                      type="number"
                      placeholder="درصد سود (۳۰)"
                      value={newOpProfit}
                      onChange={(e) => setNewOpProfit(parseInt(e.target.value) || 0)}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-center font-bold"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddOperator}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      تایید همکار
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddOp(false)}
                      className="px-3 py-1.5 border rounded-lg text-xs"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {/* لیست همکاران اضافه شده */}
              {operators.length > 0 && (
                <div className="space-y-1.5">
                  {operators.map((op, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200">{op.full_name}</strong>
                        <span className="text-slate-400 font-mono">({op.username})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                          سهم سود: {op.profit_percentage}٪
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOperator(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <span>مرحله بعدی: بارگذاری نرخ‌نامه خدمات با اکسل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* محتوای مرحله ۲: بارگذاری اکسل خدمات و تعرفه‌ها */}
        {step === 2 && (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* راهنمای گام ۲ */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>تعریف سریع نرخ‌نامه با فایل اکسل (Excel Import)</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                کافی‌است فایل قالب آماده را دانلود کرده، عناوین خدمات و قیمت‌های مدنظر کافی‌نت خود را در آن بنویسید و فایل را در کادر زیر رها کنید.
              </p>
              <div>
                <button
                  type="button"
                  onClick={downloadServicesTemplateExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all mt-1"
                >
                  <Download className="w-4 h-4" />
                  دانلود قالب آماده اکسل نرخ‌نامه (.xlsx)
                </button>
              </div>
            </div>

            {/* کادر آپلود اکسل */}
            <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-zinc-900/50 hover:border-blue-500 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 dark:text-zinc-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                فایل اکسل پر شده نرخ‌نامه را اینجا انتخاب یا رها کنید
              </div>
              <p className="text-[11px] text-slate-400 mb-4">پشتیبانی کامل از فرمت‌های xlsx. و xls.</p>

              <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all">
                <span>انتخاب فایل اکسل</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
              </label>

              {isParsingExcel && (
                <div className="text-xs text-blue-600 font-bold mt-3 animate-pulse">
                  در حال خواندن و اعتبارسنجی فایل اکسل...
                </div>
              )}
            </div>

            {excelError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{excelError}</span>
              </div>
            )}

            {/* پیش‌نمایش اقلام استخراج شده از اکسل */}
            {servicesList.length > 0 && (
              <div className="space-y-2 border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 bg-slate-50/70 dark:bg-zinc-900/70">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>فایل: {excelFileName} ({servicesList.length} خدمت شناسایی شد)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setServicesList([]);
                      setExcelFileName('');
                    }}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    حذف و انتخاب مجدد
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-zinc-900 text-slate-500 sticky top-0">
                      <tr>
                        <th className="p-2">ردیف</th>
                        <th className="p-2">دسته‌بندی</th>
                        <th className="p-2">عنوان خدمت</th>
                        <th className="p-2">نرخ مصوب (تومان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                      {servicesList.slice(0, 50).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-750">
                          <td className="p-2 text-slate-400">{idx + 1}</td>
                          <td className="p-2 text-slate-500">{s.category}</td>
                          <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{s.title}</td>
                          <td className="p-2 font-bold text-emerald-600 dark:text-emerald-400">
                            {formatToman(s.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* در صورت عدم دسترسی به اکسل در لحظه */}
            {servicesList.length === 0 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadSampleServices}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  فعلاً فایل اکسل آماده ندارید؟ برای شروع از تعرفه‌های استاندارد پیش‌فرض استفاده کنید &larr;
                </button>
              </div>
            )}

            {/* دکمه‌های ناوبری گام ۲ */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت به مشخصات</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeSetup}
                disabled={servicesList.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <span>تایید نهایی و راه‌اندازی سیستم</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* محتوای مرحله ۳: پیام موفقیت و ورود به برنامه */}
        {step === 3 && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                تبریک! کافی‌نت «{cafeName}» با موفقیت راه‌اندازی شد.
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                اطلاعات حساب کاربری شما و کلیه تعرفه‌های واردشده از فایل اکسل به طور دائمی ذخیره شدند و نرم‌افزار هم‌اکنون ۱۰۰٪ آماده صدور فاکتور و ثبت عملیات است.
              </p>
            </div>

            {/* کارت خلاصه راه‌اندازی */}
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 text-xs space-y-2 text-right">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">مدیر سیستم:</span>
                <strong className="text-slate-800 dark:text-slate-200">{adminName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">پین‌کد ورود مدیر:</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400">{adminPin}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500">همکاران تعریف شده:</span>
                <strong>{operators.length > 0 ? `${operators.length} متصدی` : 'تعریف نشده (قابل افزودن)'}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">تعداد خدمات نرخ‌نامه:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{servicesList.length} خدمت فعال</strong>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  // ریفرش صفحه یا لود مستقیم برای ورود
                  window.location.reload();
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xl shadow-blue-500/25 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <span>ورود به سیستم و شروع کار</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
