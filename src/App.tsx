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

export const App: React.FC = () => {
  const { currentUser, isLocked, lockScreen } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
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

  // کلید میانبر قفل صفحه حریم خصوصی (Alt + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'م')) {
        e.preventDefault();
        lockScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockScreen]);

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
    </div>
  );
};
