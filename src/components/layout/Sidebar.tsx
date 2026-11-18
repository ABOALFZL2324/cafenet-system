import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  ClipboardList,
  Receipt,
  ArrowDownCircle,
  Clock,
  Tags,
  BadgeDollarSign,
  BarChart3,
  Users,
  Settings,
  Lock,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pending'
  | 'invoices'
  | 'expenses'
  | 'shifts'
  | 'rates'
  | 'settlement'
  | 'analytics'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { pendingOrders } = useData();

  const isAdmin = currentUser?.role === 'admin';

  const activePendingCount = pendingOrders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress'
  ).length;

  const sections: NavSection[] = [
    {
      title: 'میز کار و دخل',
      items: [
        { id: 'dashboard', label: 'داشبورد و دخل امروز', icon: LayoutDashboard },
        {
          id: 'pending',
          label: 'سفارشات معلق و مدارک',
          icon: ClipboardList,
          badge: activePendingCount > 0 ? activePendingCount : undefined,
        },
        { id: 'invoices', label: 'فاکتورها و دریافتی‌ها', icon: Receipt },
        { id: 'expenses', label: 'هزینه‌های مغازه', icon: ArrowDownCircle },
      ],
    },
    {
      title: 'شیفت و کارکرد',
      items: [
        { id: 'shifts', label: 'شیفت‌ها و ساعات پرسنل', icon: Clock },
        { id: 'settlement', label: 'تسویه و کارکرد ماهانه', icon: BadgeDollarSign },
      ],
    },
    {
      title: 'تعاریف و مدیریت',
      items: [
        { id: 'rates', label: 'نرخ‌نامه و تعرفه خدمات', icon: Tags },
        { id: 'analytics', label: 'گزارشات و هوش تجاری', icon: BarChart3 },
        { id: 'users', label: 'کاربران و درصد سهم', icon: Users, adminOnly: true },
        { id: 'settings', label: 'تنظیمات و دیتابیس', icon: Settings, adminOnly: true },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white/95 dark:bg-[#1f1f23]/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-zinc-800/80 flex flex-col justify-between p-3 select-none no-print shadow-sm z-20">
      <div className="overflow-y-auto space-y-5 pr-0.5">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-black tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isRestricted = item.adminOnly && !isAdmin;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isRestricted) {
                        alert('این بخش منحصراً مخصوص مدیر کافی‌نت است و برای متصدیان در دسترس نیست.');
                        return;
                      }
                      onSelectTab(item.id);
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold'
                        : isRestricted
                        ? 'text-slate-400 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-not-allowed opacity-60'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/90 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isRestricted
                            ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                            : 'bg-slate-100/80 dark:bg-zinc-800/70 text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isRestricted && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" title="مخصوص مدیریت" />
                      )}
                      {item.badge !== undefined && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronLeft className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* وضعیت امنیت و اتصال لوکال */}
      <div className="mt-3 p-3 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-zinc-900/90 dark:to-zinc-850/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 shadow-inner">
        <div className="flex items-center justify-between font-black text-slate-700 dark:text-slate-200 mb-1">
          <span className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            امنیت و ایزولاسیون:
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            آفلاین و امن
          </span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed">
          دیتابیس در حافظه دستگاه، بدون نیاز به اینترنت و بدون ردیابی ابری.
        </p>
      </div>
    </aside>
  );
};
