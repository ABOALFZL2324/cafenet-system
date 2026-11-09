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

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser } = useAuth();
  const { pendingOrders } = useData();

  const isAdmin = currentUser?.role === 'admin';

  const activePendingCount = pendingOrders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress'
  ).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'داشبورد و دخل امروز', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'pending',
      label: 'میز کار سفارشات معلق',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: activePendingCount > 0 ? activePendingCount : undefined,
    },
    { id: 'invoices', label: 'فاکتورها و دریافتی‌ها', icon: <Receipt className="w-4 h-4" /> },
    { id: 'expenses', label: 'هزینه‌های مغازه', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'shifts', label: 'شیفت‌ها و ساعات کارکرد', icon: <Clock className="w-4 h-4" /> },
    { id: 'rates', label: 'نرخ‌نامه و تعرفه خدمات', icon: <Tags className="w-4 h-4" /> },
    { id: 'settlement', label: 'تسویه سود ماهانه', icon: <BadgeDollarSign className="w-4 h-4" /> },
    { id: 'analytics', label: 'هوش تجاری و آمار', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'کاربران و درصد سهم', icon: <Users className="w-4 h-4" />, adminOnly: true },
    { id: 'settings', label: 'تنظیمات و پشتیبان‌گیری', icon: <Settings className="w-4 h-4" />, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white/95 dark:bg-[#252525]/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-zinc-700/80 flex flex-col justify-between p-3 select-none no-print shadow-sm">
      <nav className="space-y-1">
        {navItems.map((item) => {
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : isRestricted
                  ? 'text-slate-400 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-not-allowed opacity-75'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : isRestricted ? 'text-slate-400' : 'text-slate-500 dark:text-zinc-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isRestricted && <Lock className="w-3 h-3 text-slate-400" title="مخصوص مدیریت" />}
                {item.badge !== undefined && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* وضعیت امنیت و اتصال لوکال */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-800/70 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 text-[11px] text-slate-500 dark:text-zinc-400">
        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200 mb-1">
          <span>حفاظت سایبری:</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            فعال و ایزوله
          </span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-400 leading-tight">
          کنترل دسترسی نقش‌ها (RBAC) و مسدودسازی حدس پین فعال است.
        </p>
      </div>
    </aside>
  );
};
