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
import { loadDatabase, saveDatabase, AppDatabaseState, syncDatabaseWithDisk, resetDatabaseToCleanSlate } from '../utils/storage';
import { isInJalaliMonth } from '../utils/jalali';
import { sanitizeInput } from '../utils/security';

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
  importServicesBulk: (servicesList: { category: string; title: string; unit_price: number }[], replaceExisting?: boolean) => number;
  // مدیریت کاربران
  addUser: (userData: Omit<User, 'id' | 'created_at'>) => void;
  updateUser: (id: number, userData: Partial<User>) => void;
  deleteUser: (id: number) => void;
  restoreUser: (id: number) => void;
  // راه‌اندازی و تنظیمات
  setupInitialSystem: (setupData: {
    cafeName: string;
    phone: string;
    address: string;
    adminUser: { full_name: string; username: string; pin_code: string; profit_percentage: number };
    operators?: Omit<User, 'id' | 'created_at'>[];
    services: { category: string; title: string; unit_price: number }[];
  }) => void;
  resetToCleanSlate: () => void;
  updateSettings: (newSettings: Partial<CafeNetSettings>) => void;
  // تسویه ماهانه
  calculateMonthlySettlement: (year: number, month: number, model: SettlementModel, employerPercentage?: number) => MonthlySettlementRecord;
  finalizeSettlement: (record: MonthlySettlementRecord) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState<AppDatabaseState>(loadDatabase());

  const refreshData = () => {
    setDbState(loadDatabase());
  };

  useEffect(() => {
    // بارگذاری اولیه از هارد دیسک و اطمینان از همگام بودن دائمی
    syncDatabaseWithDisk().then((diskState) => {
      if (diskState) {
        setDbState(diskState);
      }
    });
  }, []);

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>): Invoice => {
    const db = loadDatabase();
    const id = Date.now();
    const invoiceNum = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(db.invoices.length + 1).toString().padStart(3, '0')}`;
    
    // ضدعفونی‌سازی امنیتی ورودی‌ها
    const sanitizedItems = invoiceData.items.map((i) => ({
      ...i,
      service_title: sanitizeInput(i.service_title),
      category_name: i.category_name ? sanitizeInput(i.category_name) : undefined,
    }));

    const newInvoice: Invoice = {
      ...invoiceData,
      customer_name: invoiceData.customer_name ? sanitizeInput(invoiceData.customer_name) : undefined,
      customer_phone: invoiceData.customer_phone ? sanitizeInput(invoiceData.customer_phone) : undefined,
      items: sanitizedItems,
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
      title: sanitizeInput(expenseData.title),
      description: expenseData.description ? sanitizeInput(expenseData.description) : undefined,
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
      customer_name: sanitizeInput(orderData.customer_name),
      customer_phone: sanitizeInput(orderData.customer_phone),
      title: sanitizeInput(orderData.title),
      details: orderData.details ? sanitizeInput(orderData.details) : undefined,
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

  // ورود گروهی خدمات از فایل اکسل به پایگاه‌داده
  const importServicesBulk = (
    servicesList: { category: string; title: string; unit_price: number }[],
    replaceExisting: boolean = false
  ): number => {
    const db = loadDatabase();
    if (replaceExisting) {
      db.services = [];
    }

    let nextCatId = db.serviceCategories.length > 0 ? Math.max(...db.serviceCategories.map((c) => c.id)) + 1 : 1;
    let nextServiceId = db.services.length > 0 ? Math.max(...db.services.map((s) => s.id)) + 1 : 1;
    let count = 0;

    for (const item of servicesList) {
      const catName = sanitizeInput(item.category.trim()) || 'عمومی و متفرقه';
      let category = db.serviceCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());

      if (!category) {
        category = { id: nextCatId++, name: catName, is_active: true };
        db.serviceCategories.push(category);
      }

      const cleanTitle = sanitizeInput(item.title.trim());
      if (!cleanTitle) continue;

      db.services.push({
        id: nextServiceId++,
        category_id: category.id,
        category_name: category.name,
        title: cleanTitle,
        unit_price: item.unit_price,
        is_active: true,
      });

      count++;
    }

    saveDatabase(db);
    setDbState({ ...db });
    return count;
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

  // حذف منطقی (Soft Delete) اپراتور بدون دستکاری یا حذف هیچ‌یک از تراکنش‌های قبلی او
  const deleteUser = (id: number) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      // فقط وضعیت حذف منطقی ثبت می‌شود؛ تراکنش‌ها، فاکتورها، هزینه‌ها و شیفت‌ها کاملاً دست‌نخورده باقی می‌مانند
      db.users[idx] = {
        ...db.users[idx],
        is_deleted: true,
        is_active: false,
        deleted_at: new Date().toISOString(),
      };
      saveDatabase(db);
      setDbState({ ...db });
    }
  };

  // بازیابی اپراتور حذف‌شده
  const restoreUser = (id: number) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users[idx] = {
        ...db.users[idx],
        is_deleted: false,
        is_active: true,
        deleted_at: undefined,
      };
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

  // راه‌اندازی اولیه ویزاردی سیستم خام با اطلاعات مدیر و اکسل خدمات
  const setupInitialSystem = (setupData: {
    cafeName: string;
    phone: string;
    address: string;
    adminUser: { full_name: string; username: string; pin_code: string; profit_percentage: number };
    operators?: Omit<User, 'id' | 'created_at'>[];
    services: { category: string; title: string; unit_price: number }[];
  }) => {
    const db = loadDatabase();

    db.settings = {
      ...db.settings,
      name: sanitizeInput(setupData.cafeName) || 'کافی‌نت',
      phone: sanitizeInput(setupData.phone) || '',
      address: sanitizeInput(setupData.address) || '',
      is_initialized: true,
    };

    // ایجاد مدیر ارشد
    const adminUser: User = {
      id: 1,
      full_name: sanitizeInput(setupData.adminUser.full_name),
      username: sanitizeInput(setupData.adminUser.username).toLowerCase() || 'admin',
      pin_code: setupData.adminUser.pin_code,
      role: 'admin',
      profit_percentage: setupData.adminUser.profit_percentage ?? 100,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.users = [adminUser];

    // ایجاد اپراتورها در صورت تعریف
    if (setupData.operators && setupData.operators.length > 0) {
      setupData.operators.forEach((op, idx) => {
        db.users.push({
          ...op,
          id: idx + 2,
          full_name: sanitizeInput(op.full_name),
          username: sanitizeInput(op.username).toLowerCase(),
          role: 'operator',
          is_active: true,
          created_at: new Date().toISOString(),
        });
      });
    }

    // ایجاد دسته‌ها و خدمات اکسل
    db.services = [];
    db.serviceCategories = [];
    let nextCatId = 1;
    let nextServiceId = 1;

    for (const item of setupData.services) {
      const catName = sanitizeInput(item.category.trim()) || 'عمومی و متفرقه';
      let category = db.serviceCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase());

      if (!category) {
        category = { id: nextCatId++, name: catName, is_active: true };
        db.serviceCategories.push(category);
      }

      db.services.push({
        id: nextServiceId++,
        category_id: category.id,
        category_name: category.name,
        title: sanitizeInput(item.title.trim()),
        unit_price: item.unit_price,
        is_active: true,
      });
    }

    db.activeShiftId = null;
    db.activeUserId = null;

    saveDatabase(db);
    setDbState({ ...db });
  };

  // بازگرداندن سیستم به حالت خام جهت راه‌اندازی مجدد
  const resetToCleanSlate = () => {
    resetDatabaseToCleanSlate();
    setDbState(loadDatabase());
  };

  // محاسبه دقیق و واقعی سود ماهانه (شامل مدل شراکتی، عملکردی و ساعت کارکرد حضور)
  const calculateMonthlySettlement = (
    year: number,
    month: number,
    model: SettlementModel,
    employerPercentage?: number
  ): MonthlySettlementRecord => {
    const db = loadDatabase();

    // فیلتر کردن درآمدها و هزینه‌های این ماه شمسی خاص
    const monthInvoices = db.invoices.filter((inv) => isInJalaliMonth(inv.created_at, year, month));
    const monthExpenses = db.expenses.filter((exp) => isInJalaliMonth(exp.created_at, year, month));
    const monthShifts = db.shifts.filter((s) => isInJalaliMonth(s.start_time, year, month));

    const totalIncome = monthInvoices.reduce((acc, inv) => acc + inv.final_amount, 0);
    const totalExpense = monthExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = Math.max(0, totalIncome - totalExpense);

    // محاسبه ساعات کارکرد کارگران در این ماه
    const userHoursMap = new Map<number, number>();
    monthShifts.forEach((s) => {
      if (s.workers && s.workers.length > 0) {
        s.workers.forEach((w) => {
          let h = w.hours;
          if (h === undefined || h === null) {
            const startMs = new Date(s.start_time).getTime();
            const endMs = s.end_time ? new Date(s.end_time).getTime() : Date.now();
            h = Math.max(0.1, Number(((endMs - startMs) / (1000 * 3600)).toFixed(2)));
          }
          userHoursMap.set(w.user_id, (userHoursMap.get(w.user_id) || 0) + h);
        });
      } else {
        // شیفت‌های قبل از به‌روزرسانی که فقط user_id داشتند
        const startMs = new Date(s.start_time).getTime();
        const endMs = s.end_time ? new Date(s.end_time).getTime() : Date.now();
        const h = Math.max(0.1, Number(((endMs - startMs) / (1000 * 3600)).toFixed(2)));
        userHoursMap.set(s.user_id, (userHoursMap.get(s.user_id) || 0) + h);
      }
    });

    // سهم کارفرما و بودجه کل پرداختی ساعتی
    const employerPercentageValue =
      employerPercentage !== undefined
        ? employerPercentage
        : (db.settings.default_employer_percentage ?? 50);

    const employerAmount = Math.round((netProfit * employerPercentageValue) / 100);
    const remainingProfit = Math.max(0, netProfit - employerAmount);

    let totalWorkersHours = 0;
    userHoursMap.forEach((hrs) => {
      totalWorkersHours += hrs;
    });
    totalWorkersHours = Number(totalWorkersHours.toFixed(2));

    const hourlyRateBudget =
      totalWorkersHours > 0 ? Math.round(remainingProfit / totalWorkersHours) : 0;

    // کاربران فعال به علاوه کاربرانی که ممکن است بعداً حذف شده باشند اما در این ماه فعالیت داشته‌اند
    const relevantUsers = db.users.filter((u) => {
      const hasInvoicesInMonth = monthInvoices.some((inv) => inv.user_id === u.id);
      const hasHours = (userHoursMap.get(u.id) || 0) > 0;
      return (u.is_active && !u.is_deleted) || hasInvoicesInMonth || hasHours;
    });

    const details = relevantUsers.map((user) => {
      // درآمد ایجاد شده توسط شیفت‌ها و تراکنش‌های این اپراتور
      const userInvoices = monthInvoices.filter((inv) => inv.user_id === user.id);
      const userIncome = userInvoices.reduce((acc, inv) => acc + inv.final_amount, 0);
      const userHoursWorked = Number((userHoursMap.get(user.id) || 0).toFixed(2));

      let userAllocatedExpense = 0;
      let userNetProfit = 0;
      let userShareAmount = 0;
      let userHourlyShareAmount = 0;

      if (model === 'total_share') {
        // روش الف: شراکت از کل سود ماه
        userNetProfit = netProfit;
        userShareAmount = Math.round((netProfit * user.profit_percentage) / 100);
      } else if (model === 'individual_performance') {
        // روش ب: پورسانت عملکردی فردی با تسهیم هزینه
        const userIncomeRatio = totalIncome > 0 ? userIncome / totalIncome : 0;
        userAllocatedExpense = Math.round(totalExpense * userIncomeRatio);
        userNetProfit = Math.max(0, userIncome - userAllocatedExpense);
        userShareAmount = Math.round((userNetProfit * user.profit_percentage) / 100);
      } else if (model === 'hourly_attendance') {
        // روش ج: محاسبه حقوق بر پایه ساعت کار حضور و سهم کارفرما
        userHourlyShareAmount = Math.round(userHoursWorked * hourlyRateBudget);
        userNetProfit = userHourlyShareAmount;
        userShareAmount = userHourlyShareAmount;
      }

      return {
        user_id: user.id,
        user_name: user.full_name,
        profit_percentage: user.profit_percentage,
        hours_worked: userHoursWorked,
        hourly_share_amount: userHourlyShareAmount,
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
      employer_percentage: model === 'hourly_attendance' ? employerPercentageValue : undefined,
      employer_amount: model === 'hourly_attendance' ? employerAmount : undefined,
      total_workers_hours: model === 'hourly_attendance' ? totalWorkersHours : undefined,
      hourly_rate_budget: model === 'hourly_attendance' ? hourlyRateBudget : undefined,
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
        importServicesBulk,
        addUser,
        updateUser,
        deleteUser,
        restoreUser,
        setupInitialSystem,
        resetToCleanSlate,
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
