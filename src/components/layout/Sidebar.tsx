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

  const activePendingCount = pendingOrders.filter(
    (o) => o.status === 'pending' || o.status === 'in_progress'
  ).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'داشبورد و دخل', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'pending',
      label: 'کارهای در دست اقدام',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: activePendingCount > 0 ? activePendingCount : undefined,
    },
    { id: 'invoices', label: 'فاکتورها و دریافتی‌ها', icon: <Receipt className="w-4 h-4" /> },
    { id: 'expenses', label: 'هزینه‌های مغازه', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'shifts', label: 'شیفت‌ها و کارکرد', icon: <Clock className="w-4 h-4" /> },
    { id: 'rates', label: 'نرخ‌نامه و تعرفه‌ها', icon: <Tags className="w-4 h-4" /> },
    { id: 'settlement', label: 'تسویه سود ماهانه', icon: <BadgeDollarSign className="w-4 h-4" /> },
    { id: 'analytics', label: 'هوش تجاری و آمار', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'کاربران و درصدها', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'تنظیمات و پشتیبان‌گیری', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#252525] border-l border-fluent-border dark:border-fluent-darkBorder flex flex-col justify-between p-3 select-none">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* وضعیت سیستم */}
      <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/70 dark:border-zinc-700/60 text-[11px] text-slate-500 dark:text-zinc-400">
        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
          <span>وضعیت سیستم</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            لوکال و آفلاین
          </span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
          داده‌ها به طور خودکار در سیستم ذخیره می‌شوند.
        </p>
      </div>
    </aside>
  );
};
