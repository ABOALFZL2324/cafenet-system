import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Search,
  Globe,
  Car,
  Shield,
  GraduationCap,
  Briefcase,
  HeartPulse,
  Mail,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface QuickLinkItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  category: 'police' | 'judicial' | 'education' | 'tax' | 'insurance' | 'general';
  tags: string[];
  color: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  // انتظامی و خودرو
  {
    id: 'sakha',
    title: 'سامانه سخا (پلیس)',
    subtitle: 'نوبت‌دهی تعویض پلاک، گواهینامه، گذرنامه، کارت پایان خدمت',
    url: 'https://sakha.epolice.ir',
    category: 'police',
    tags: ['سخا', 'پلیس', 'تعویض پلاک', 'گذرنامه', 'گواهینامه', 'نظام وظیفه', 'پایان خدمت'],
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'rahvar',
    title: 'پلیس راهور ۱۲۰',
    subtitle: 'استعلام خلافی، نمره منفی و وضعیت پلاک خودرو',
    url: 'https://rahvar120.ir',
    category: 'police',
    tags: ['راهور', 'خلافی', 'جریمه', 'پلاک', 'نمره منفی', 'خودرو'],
    color: 'from-amber-600 to-amber-700',
  },
  {
    id: 'symfa',
    title: 'سامانه سیمفا',
    subtitle: 'استعلام معاینه فنی خودروهای سبک و سنگین',
    url: 'https://symfa.ir',
    category: 'police',
    tags: ['سیمفا', 'معاینه فنی', 'خودرو'],
    color: 'from-yellow-600 to-amber-600',
  },

  // قضایی و اسناد
  {
    id: 'adliran',
    title: 'درگاه عدل ایران (ثنا)',
    subtitle: 'ثبت‌نام ثنا، ابلاغ الکترونیک، گواهی عدم سوءپیشینه',
    url: 'https://adliran.ir',
    category: 'judicial',
    tags: ['ثنا', 'عدل ایران', 'ابلاغیه', 'عدم سوء پیشینه', 'دادگاه', 'قوه قضاییه'],
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'my-ssaa',
    title: 'درگاه ثبت من (اسناد و املاک)',
    subtitle: 'املاک، اسناد رسمی، ثبت شرکت‌ها، وقایع ازدواج و طلاق',
    url: 'https://my.ssaa.ir',
    category: 'judicial',
    tags: ['ثبت من', 'سازمان ثبت', 'سند', 'ملک', 'ازدواج', 'طلاق', 'شرکت'],
    color: 'from-purple-600 to-purple-800',
  },

  // آموزش و مدارس
  {
    id: 'mymedu',
    title: 'مای مدیو (آموزش و پرورش)',
    subtitle: 'پرونده الکترونیک دانش‌آموزی، کارنامه، ثبت‌نام کتب درسی',
    url: 'https://my.medu.ir',
    category: 'education',
    tags: ['مدیو', 'مای مدیو', 'آموزش پرورش', 'کارنامه', 'کتاب درسی', 'مدارس', 'سنجش سلامت'],
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'sanjesh',
    title: 'سازمان ملی سنجش',
    subtitle: 'ثبت‌نام کنکور، آزمون‌های استخدامی و ارشد/دکتری',
    url: 'https://sanjesh.org',
    category: 'education',
    tags: ['سنجش', 'کنکور', 'استخدامی', 'ارشد', 'دکتری', 'کارنامه کنکور', 'کارت آزمون'],
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'saorg',
    title: 'سامانه سجاد',
    subtitle: 'تایید مدارک تحصیلی دانشگاهی، امور دانشجویان خارج و داخل',
    url: 'https://portal.saorg.ir',
    category: 'education',
    tags: ['سجاد', 'تایید مدرک', 'دانشجویی', 'وزارت علوم'],
    color: 'from-sky-600 to-blue-700',
  },

  // مالیات و کسب‌وکار
  {
    id: 'mojavez',
    title: 'درگاه ملی مجوزها',
    subtitle: 'صدور، تمدید و دریافت شناسه یکتا پروانه کسب و مشاغل',
    url: 'https://mojavez.ir',
    category: 'tax',
    tags: ['مجوزها', 'پروانه کسب', 'جواز کسب', 'شناسه یکتا', 'کسب و کار'],
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'mytax',
    title: 'درگاه ملی خدمات الکترونیک مالیاتی',
    subtitle: 'اظهارنامه مشاغل، تبصره ۱۰۰، ارزش افزوده، کارپوشه مودیان',
    url: 'https://my.tax.gov.ir',
    category: 'tax',
    tags: ['مالیات', 'مای تکس', 'تبصره ۱۰۰', 'اظهارنامه', 'ارزش افزوده', 'مودیان'],
    color: 'from-teal-600 to-emerald-700',
  },
  {
    id: 'ntsw',
    title: 'سامانه جامع تجارت ایران',
    subtitle: 'ثبت سفارش، انبارها، تخصیص ارز و بازرگانی',
    url: 'https://ntsw.ir',
    category: 'tax',
    tags: ['تجارت', 'جامع تجارت', 'انبار', 'بازرگانی', 'شناسه کالا'],
    color: 'from-emerald-700 to-green-700',
  },

  // بیمه و بازنشستگی
  {
    id: 'tamin',
    title: 'خدمات غیرحضوری تامین اجتماعی',
    subtitle: 'مشاهده سوابق بیمه، استعلام استحقاق درمان، فیش حقوقی مستمری‌بگیران',
    url: 'https://eservices.tamin.ir',
    category: 'insurance',
    tags: ['تامین اجتماعی', 'سابقه بیمه', 'فیش حقوقی', 'حق بیمه', 'درمان'],
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'salamat',
    title: 'بیمه سلامت ایران',
    subtitle: 'استعلام پوشش بیمه سلامت و تمدید دفترچه',
    url: 'https://eservices.ihio.gov.ir',
    category: 'insurance',
    tags: ['بیمه سلامت', 'پوشش درمانی', 'دفترچه'],
    color: 'from-rose-600 to-rose-700',
  },
  {
    id: 'cspf',
    title: 'صندوق بازنشستگی کشوری',
    subtitle: 'فیش حقوقی بازنشستگان کشوری، وام، احکام حقوقی',
    url: 'https://cspf.ir',
    category: 'insurance',
    tags: ['بازنشستگی', 'صندوق بازنشستگی', 'فیش بازنشستگان', 'حکم حقوقی'],
    color: 'from-pink-600 to-rose-700',
  },

  // خدمات عمومی و پستی
  {
    id: 'post-tracking',
    title: 'سامانه رهگیری مرسولات پستی',
    subtitle: 'پیگیری آنلاین مرسولات پیشتاز، سفارشی، شناسنامه و گذرنامه با کد رهگیری',
    url: 'https://tracking.post.ir',
    category: 'general',
    tags: ['پست', 'رهگیری پست', 'کد مرسوله', 'بسته پستی', 'پیشتاز'],
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'amlak',
    title: 'سامانه املاک و اسکان',
    subtitle: 'ثبت اقامتگاه و املاک سرپرستان خانوار',
    url: 'https://amlak.mrud.ir',
    category: 'general',
    tags: ['املاک', 'اسکان', 'مسکن', 'سرپرست خانوار', 'اقامتگاه'],
    color: 'from-slate-600 to-slate-800',
  },
  {
    id: 'fars-subvention',
    title: 'سامانه حمایت (یارانه معیشتی)',
    subtitle: 'استعلام دهک‌بندی، اعتراض به یارانه و وضعیت خانوار',
    url: 'https://hemayat.mcls.gov.ir',
    category: 'general',
    tags: ['حمایت', 'یارانه', 'دهک بندی', 'معیشتی', 'رفاه'],
    color: 'from-violet-600 to-purple-700',
  },
];

type CategoryFilter = 'all' | 'police' | 'judicial' | 'education' | 'tax' | 'insurance' | 'general';

export const QuickLinksDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'همه سامانه‌ها', icon: Globe },
    { id: 'police', label: 'انتظامی و خودرو', icon: Car },
    { id: 'judicial', label: 'قضایی و ثبتی', icon: Shield },
    { id: 'education', label: 'مدارس و سنجش', icon: GraduationCap },
    { id: 'tax', label: 'مالیات و مجوزها', icon: Briefcase },
    { id: 'insurance', label: 'بیمه و بازنشستگی', icon: HeartPulse },
    { id: 'general', label: 'پست و عمومی', icon: Mail },
  ];

  const filteredLinks = useMemo(() => {
    return QUICK_LINKS.filter((item) => {
      // فیلتر دسته‌بندی
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // فیلتر جستجو
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(q);
      const inSubtitle = item.subtitle.toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const inUrl = item.url.toLowerCase().includes(q);
      return inTitle || inSubtitle || inTags || inUrl;
    });
  }, [searchQuery, activeCategory]);

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#202024] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden p-5 space-y-4">
      {/* سربرگ داشبورد لینک‌ها */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>سامانه‌های پرکاربرد و خدمات دولت الکترونیک</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                دسترسـی سـریع
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              ورود با یک کلیک به سایت‌های پرمراجعه کافی‌نت جهت تسریع در خدمات‌رسانی به مشتریان
            </p>
          </div>
        </div>

        {/* فیلد جستجوی زنده */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی سامانه (مثلاً سخا، گذرنامه، مالیات...)"
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-[10px] bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-full w-4 h-4 flex items-center justify-center hover:bg-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* تب‌های دسته‌بندی */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryFilter)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 ring-2 ring-blue-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* شبکه کارت‌های لینک سریع */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredLinks.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
            سامانه‌ای با عنوان «{searchQuery}» پیدا نشد.
          </div>
        ) : (
          filteredLinks.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenLink(item.url)}
              className="cursor-pointer group relative bg-slate-50/80 hover:bg-white dark:bg-zinc-850/60 dark:hover:bg-zinc-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${item.color} shadow-xs shrink-0`} />
                    <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopyLink(e, item.id, item.url)}
                      title="کپی لینک"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="p-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                  {item.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors truncate max-w-[170px]" dir="ltr">
                  {item.url.replace('https://', '')}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ورود ←
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
