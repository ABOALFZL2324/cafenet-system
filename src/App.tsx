import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginView } from './components/layout/LoginView';
import { QuickLockModal } from './components/layout/QuickLockModal';

// نماهای صفحات
import { DashboardView } from './components/dashboard/DashboardView';
import { PendingOrdersView } from './components/pendingOrders/PendingOrdersView';
import { InvoicesListView } from './components/invoices/InvoicesListView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ShiftsView } from './components/shifts/ShiftsView';
import { ServicesRatesView } from './components/services/ServicesRatesView';
import { MonthlySettlementView } from './components/settlement/MonthlySettlementView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickSaleModal } from './components/dashboard/QuickSaleModal';
import { InvoiceViewModal } from './components/invoices/InvoiceViewModal';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { useData } from './context/DataContext';

export const App: React.FC = () => {
  const { currentUser, isLocked, lockScreen } = useAuth();
  const { users, settings } = useData();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isGlobalInvoiceOpen, setIsGlobalInvoiceOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('cafenet_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cafenet_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cafenet_dark_mode', 'false');
    }
  }, [darkMode]);

  // کلیدهای میانبر سرتاسری نرم‌افزار (Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // شورت‌کات سرتاسری ثبت فاکتور جدید (Ctrl + N یا Ctrl + د)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyN' || e.key === 'n' || e.key === 'N' || e.key === 'د')) {
        e.preventDefault();
        setIsGlobalInvoiceOpen(true);
        return;
      }

      // قفل سریع صفحه با Alt + L
      if (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'م')) {
        e.preventDefault();
        lockScreen();
        return;
      }

      // سوئیچ تب‌ها با کلیدهای تابعی یا Alt + عدد
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pending');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentTab('invoices');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCurrentTab('expenses');
      } else if (e.key === 'F5' && !e.ctrlKey) {
        // جلوگیری از رفرش ناخواسته صفحه با F5، بلکه رفتن به تسویه
        e.preventDefault();
        setCurrentTab('settlement');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setCurrentTab('rates');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setCurrentTab('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockScreen]);

  // اگر سیستم هنوز راه‌اندازی نشده یا فاقد کاربر است، ویزارد راه‌اندازی اولیه و ورود اکسل اجرا شود
  if (!settings.is_initialized || users.length === 0) {
    return <OnboardingWizard />;
  }

  // اگر کاربری لاگین نکرده باشد، صفحه لاگین را نشان بده
  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'pending':
        return <PendingOrdersView />;
      case 'invoices':
        return <InvoicesListView />;
      case 'expenses':
        return <ExpensesView />;
      case 'shifts':
        return <ShiftsView />;
      case 'rates':
        return <ServicesRatesView />;
      case 'settlement':
        return <MonthlySettlementView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f3f3f3] dark:bg-[#202020] text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* نوار عنوان ویندوز */}
      <TitleBar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* نوار راهنمای کلیدهای میانبر سریع */}
      <div className="h-6 bg-slate-200/80 dark:bg-zinc-850 border-b border-slate-300/60 dark:border-zinc-700/60 px-4 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 no-print select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
            <kbd className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-black shadow-sm">Ctrl + N</kbd>
            ثبت فاکتور سریع
          </span>
          <span className="text-slate-300 dark:text-zinc-600">|</span>
          <span>میانبرها:</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F1</kbd> داشبورد</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F2</kbd> سفارشات معلق</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F3</kbd> فاکتورها</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F4</kbd> هزینه‌ها</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F5</kbd> تسویه سود</span>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">F6</kbd> نرخ‌نامه</span>
        </div>
        <div>
          <span><kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-600 font-bold">Alt + L</kbd> قفل سریع صفحه</span>
        </div>
      </div>

      {/* بخش اصلی: سایدبار + محتوای تب */}
      <div className="flex-1 flex overflow-hidden">
        {/* منوی کناری */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* محتوای صفحات */}
        <main className="flex-1 overflow-y-auto p-5">
          {renderActiveView()}
        </main>
      </div>

      {/* پنجره قفل سریع صفحه */}
      <QuickLockModal />

      {/* مودال سرتاسری ثبت فاکتور سریع (Ctrl + N) */}
      <QuickSaleModal
        isOpen={isGlobalInvoiceOpen}
        onClose={() => setIsGlobalInvoiceOpen(false)}
        onViewInvoice={(id) => setSelectedInvoiceForPrint(id)}
      />

      {/* مودال چاپ ایزوله فاکتور */}
      <InvoiceViewModal
        invoiceId={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />
    </div>
  );
};
