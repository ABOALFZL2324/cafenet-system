import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Shift,
  ServiceCategory,
  ServiceItem,
  Invoice,
  Expense,
  PendingOrder,
  MonthlySettlementRecord,
  CafeNetSettings,
  OrderStatus,
  PaymentMethod,
  SettlementModel,
} from '../types';
import { loadDatabase, saveDatabase, AppDatabaseState } from '../utils/storage';
import { isInJalaliMonth } from '../utils/jalali';

interface DataContextType {
  dbState: AppDatabaseState;
  users: User[];
  shifts: Shift[];
  serviceCategories: ServiceCategory[];
  services: ServiceItem[];
  invoices: Invoice[];
  expenses: Expense[];
  pendingOrders: PendingOrder[];
  settlements: MonthlySettlementRecord[];
  settings: CafeNetSettings;
  refreshData: () => void;
  // عملیات فاکتور و درآمد
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>) => Invoice;
  // عملیات هزینه
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Expense;
  // کارهای در دست اقدام
  addPendingOrder: (orderData: Omit<PendingOrder, 'id' | 'created_at'>) => PendingOrder;
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
  deletePendingOrder: (orderId: number) => void;
  // خدمات و دسته‌ها
  addServiceItem: (item: Omit<ServiceItem, 'id'>) => void;
  updateServiceItem: (id: number, item: Partial<ServiceItem>) => void;
  deleteServiceItem: (id: number) => void;
  addServiceCategory: (name: string) => void;
  // مدیریت کاربران
  addUser: (userData: Omit<User, 'id' | 'created_at'>) => void;
  updateUser: (id: number, userData: Partial<User>) => void;
  // تنظیمات
  updateSettings: (newSettings: Partial<CafeNetSettings>) => void;
  // تسویه ماهانه
  calculateMonthlySettlement: (year: number, month: number, model: SettlementModel) => MonthlySettlementRecord;
  finalizeSettlement: (record: MonthlySettlementRecord) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState<AppDatabaseState>(loadDatabase());

  const refreshData = () => {
    setDbState(loadDatabase());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>): Invoice => {
    const db = loadDatabase();
    const id = Date.now();
    const invoiceNum = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(db.invoices.length + 1).toString().padStart(3, '0')}`;
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      invoice_number: invoiceNum,
      created_at: new Date().toISOString(),
    };

    db.invoices.unshift(newInvoice);
    saveDatabase(db);
    setDbState({ ...db });
    return newInvoice;
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>): Expense => {
    const db = loadDatabase();
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };

    db.expenses.unshift(newExpense);
    saveDatabase(db);
    setDbState({ ...db });
    return newExpense;
  };

  const addPendingOrder = (orderData: Omit<PendingOrder, 'id' | 'created_at'>): PendingOrder => {
    const db = loadDatabase();
    const newOrder: PendingOrder = {
      ...orderData,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };

    db.pendingOrders.unshift(newOrder);
    saveDatabase(db);
    setDbState({ ...db });
    return newOrder;
  };

  const updateOrderStatus = (orderId: number, status: OrderStatus) => {
    const db = loadDatabase();
    const idx = db.pendingOrders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      db.pendingOrders[idx].status = status;
      saveDatabase(db);
      setDbState({ ...db });
    }
  };

  const deletePendingOrder = (orderId: number) => {
    const db = loadDatabase();
    db.pendingOrders = db.pendingOrders.filter((o) => o.id !== orderId);
    saveDatabase(db);
    setDbState({ ...db });
  };

  const addServiceItem = (item: Omit<ServiceItem, 'id'>) => {
    const db = loadDatabase();
    const newItem: ServiceItem = { ...item, id: Date.now() };
    db.services.push(newItem);
    saveDatabase(db);
    setDbState({ ...db });
  };

  const updateServiceItem = (id: number, item: Partial<ServiceItem>) => {
    const db = loadDatabase();
    const idx = db.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.services[idx] = { ...db.services[idx], ...item };
      saveDatabase(db);
      setDbState({ ...db });
    }
  };

  const deleteServiceItem = (id: number) => {
    const db = loadDatabase();
    db.services = db.services.filter((s) => s.id !== id);
    saveDatabase(db);
    setDbState({ ...db });
  };

  const addServiceCategory = (name: string) => {
    const db = loadDatabase();
    const newCat: ServiceCategory = { id: Date.now(), name, is_active: true };
    db.serviceCategories.push(newCat);
    saveDatabase(db);
    setDbState({ ...db });
  };

  const addUser = (userData: Omit<User, 'id' | 'created_at'>) => {
    const db = loadDatabase();
    const newUser: User = {
      ...userData,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDatabase(db);
    setDbState({ ...db });
  };

  const updateUser = (id: number, userData: Partial<User>) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...userData };
      saveDatabase(db);
      setDbState({ ...db });
    }
  };

  const updateSettings = (newSettings: Partial<CafeNetSettings>) => {
    const db = loadDatabase();
    db.settings = { ...db.settings, ...newSettings };
    saveDatabase(db);
    setDbState({ ...db });
  };

  // محاسبه دقیق و واقعی سود ماهانه (برگرفته از بند ۲.۸ مدل مفهومی)
  const calculateMonthlySettlement = (
    year: number,
    month: number,
    model: SettlementModel
  ): MonthlySettlementRecord => {
    const db = loadDatabase();

    // فیلتر کردن درآمدها و هزینه‌های این ماه شمسی خاص
    const monthInvoices = db.invoices.filter((inv) => isInJalaliMonth(inv.created_at, year, month));
    const monthExpenses = db.expenses.filter((exp) => isInJalaliMonth(exp.created_at, year, month));

    const totalIncome = monthInvoices.reduce((acc, inv) => acc + inv.final_amount, 0);
    const totalExpense = monthExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = Math.max(0, totalIncome - totalExpense);

    const activeUsers = db.users.filter((u) => u.is_active);

    const details = activeUsers.map((user) => {
      // درآمد ایجاد شده توسط شیفت‌ها و تراکنش‌های این اپراتور
      const userInvoices = monthInvoices.filter((inv) => inv.user_id === user.id);
      const userIncome = userInvoices.reduce((acc, inv) => acc + inv.final_amount, 0);

      let userAllocatedExpense = 0;
      let userNetProfit = 0;
      let userShareAmount = 0;

      if (model === 'total_share') {
        // روش الف: شراکت از کل سود ماه
        userNetProfit = netProfit;
        userShareAmount = Math.round((netProfit * user.profit_percentage) / 100);
      } else {
        // روش ب: پورسانت عملکردی فردی با تسهیم هزینه
        const userIncomeRatio = totalIncome > 0 ? userIncome / totalIncome : 0;
        userAllocatedExpense = Math.round(totalExpense * userIncomeRatio);
        userNetProfit = Math.max(0, userIncome - userAllocatedExpense);
        userShareAmount = Math.round((userNetProfit * user.profit_percentage) / 100);
      }

      return {
        user_id: user.id,
        user_name: user.full_name,
        profit_percentage: user.profit_percentage,
        user_income: userIncome,
        user_allocated_expense: userAllocatedExpense,
        user_net_profit: userNetProfit,
        user_share_amount: userShareAmount,
      };
    });

    return {
      id: Date.now(),
      jalali_year: year,
      jalali_month: month,
      settlement_model: model,
      total_income: totalIncome,
      total_expense: totalExpense,
      net_profit: netProfit,
      details,
      settled_by_user_id: 1,
      is_settled: false,
      settled_at: new Date().toISOString(),
    };
  };

  const finalizeSettlement = (record: MonthlySettlementRecord) => {
    const db = loadDatabase();
    const updatedRecord = { ...record, is_settled: true, settled_at: new Date().toISOString() };
    const existingIdx = db.settlements.findIndex(
      (s) => s.jalali_year === record.jalali_year && s.jalali_month === record.jalali_month
    );
    if (existingIdx !== -1) {
      db.settlements[existingIdx] = updatedRecord;
    } else {
      db.settlements.push(updatedRecord);
    }
    saveDatabase(db);
    setDbState({ ...db });
  };

  return (
    <DataContext.Provider
      value={{
        dbState,
        users: dbState.users,
        shifts: dbState.shifts,
        serviceCategories: dbState.serviceCategories,
        services: dbState.services,
        invoices: dbState.invoices,
        expenses: dbState.expenses,
        pendingOrders: dbState.pendingOrders,
        settlements: dbState.settlements,
        settings: dbState.settings,
        refreshData,
        addInvoice,
        addExpense,
        addPendingOrder,
        updateOrderStatus,
        deletePendingOrder,
        addServiceItem,
        updateServiceItem,
        deleteServiceItem,
        addServiceCategory,
        addUser,
        updateUser,
        updateSettings,
        calculateMonthlySettlement,
        finalizeSettlement,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
