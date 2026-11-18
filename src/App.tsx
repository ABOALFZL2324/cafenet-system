import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginView } from './components/layout/LoginView';
import { QuickLockModal } from './components/layout/QuickLockModal';
import { ShortcutsModal } from './components/layout/ShortcutsModal';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

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
      // بستن سریع مودال‌های باز با Escape
      if (e.key === 'Escape') {
        setIsGlobalInvoiceOpen(false);
        setSelectedInvoiceForPrint(null);
        setIsShortcutsOpen(false);
        return;
      }

      // راهنمای میانبرها با کلید ؟ یا ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        // اگر داخل فیلد ورودی متن نیست
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          return;
        }
      }

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

      // سوئیچ تب‌ها با کلیدهای تابعی
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('dashboard');
      } else if (e.key === 'F2') {
        // اگر داخل مودال فاکتور نیستیم به تب سفارشات برود
        if (!isGlobalInvoiceOpen) {
          e.preventDefault();
          setCurrentTab('pending');
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentTab('invoices');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCurrentTab('expenses');
      } else if (e.key === 'F5' && !e.ctrlKey) {
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
  }, [lockScreen, isGlobalInvoiceOpen]);

  // اگر سیستم هنوز راه‌اندازی نشده یا فاقد کاربر است، ویزارد راه‌اندازی اولیه اجرا شود
  if (!settings.is_initialized || users.length === 0) {
    return <OnboardingWizard />;
  }

  // اگر کاربری وارد نشده باشد صفحه لاگین نمایش داده شود
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* تایتل‌بار بالای پنجره */}
      <TitleBar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* بخش اصلی بدنه: سایدبار در راست و محتوا در چپ */}
      <div className="flex flex-1 overflow-hidden">
        {/* نوار کناری (Sidebar) */}
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

        {/* ناحیه اسکرول‌شونده صفحات داخلی */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/50 dark:bg-[#18181c]/60">
          {currentTab === 'dashboard' && <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />}
          {currentTab === 'pending' && <PendingOrdersView />}
          {currentTab === 'invoices' && <InvoicesListView />}
          {currentTab === 'expenses' && <ExpensesView />}
          {currentTab === 'shifts' && <ShiftsView />}
          {currentTab === 'rates' && <ServicesRatesView />}
          {currentTab === 'settlement' && <MonthlySettlementView />}
          {currentTab === 'analytics' && <AnalyticsView />}
          {currentTab === 'users' && <UsersView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* مودال قفل سریع صفحه */}
      <QuickLockModal />

      {/* مودال راهنمای کلیدهای میانبر */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* مودال ثبت فاکتور سراسری با کلید میانبر Ctrl+N */}
      <QuickSaleModal
        isOpen={isGlobalInvoiceOpen}
        onClose={() => setIsGlobalInvoiceOpen(false)}
        onViewInvoice={(invoiceId) => {
          setIsGlobalInvoiceOpen(false);
          setSelectedInvoiceForPrint(invoiceId);
        }}
      />

      {/* مودال نمایش و پرینت فاکتور */}
      {selectedInvoiceForPrint && (
        <InvoiceViewModal
          invoiceId={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}
    </div>
  );
};
