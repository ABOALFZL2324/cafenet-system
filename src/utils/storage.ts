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
} from '../types';

export interface AppDatabaseState {
  users: User[];
  shifts: Shift[];
  serviceCategories: ServiceCategory[];
  services: ServiceItem[];
  invoices: Invoice[];
  expenses: Expense[];
  pendingOrders: PendingOrder[];
  settlements: MonthlySettlementRecord[];
  settings: CafeNetSettings;
  activeShiftId: number | null;
  activeUserId: number | null;
}

const STORAGE_KEY = 'cafenet_manager_database_v1';

// داده‌های اولیه استاندارد کافی‌نت برای راه‌اندازی بار اول (قابل ویرایش ۱۰۰٪ توسط کاربر)
export const INITIAL_DATABASE_STATE: AppDatabaseState = {
  users: [
    {
      id: 1,
      username: 'admin',
      pin_code: '1234',
      full_name: 'مدیریت کافی‌نت',
      role: 'admin',
      profit_percentage: 40,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      username: 'operator1',
      pin_code: '1111',
      full_name: 'همکار شیفت الف',
      role: 'operator',
      profit_percentage: 30,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      username: 'operator2',
      pin_code: '2222',
      full_name: 'همکار شیفت ب',
      role: 'operator',
      profit_percentage: 30,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
  shifts: [],
  serviceCategories: [
    { id: 1, name: 'چاپ، تکثیر و اسکن', is_active: true },
    { id: 2, name: 'ثبت‌نام‌های اینترنتی و آزمون‌ها', is_active: true },
    { id: 3, name: 'خدمات مالیاتی، بیمه و بازنشستگی', is_active: true },
    { id: 4, name: 'خدمات قضایی، انتظامی و خلافی', is_active: true },
    { id: 5, name: 'تایپ، ترجمه، صحافی و دانشجویی', is_active: true },
    { id: 6, name: 'لوازم جانبی کامپیوتر و تحریر', is_active: true },
  ],
  services: [
    { id: 1, category_id: 1, title: 'پرینت تک‌رو سیاه سفید (A4)', unit_price: 3000, is_active: true },
    { id: 2, category_id: 1, title: 'پرینت دورو سیاه سفید (A4)', unit_price: 5000, is_active: true },
    { id: 3, category_id: 1, title: 'پرینت رنگی (A4)', unit_price: 15000, is_active: true },
    { id: 4, category_id: 1, title: 'اسکن مدارک و اسناد (هر برگ)', unit_price: 5000, is_active: true },
    { id: 5, category_id: 1, title: 'فتوکپی سیاه سفید (هر برگ)', unit_price: 3000, is_active: true },
    { id: 6, category_id: 2, title: 'ثبت‌نام خودرو (ایران خودرو / سایپا)', unit_price: 150000, is_active: true },
    { id: 7, category_id: 2, title: 'ثبت‌نام کنکور سراسری و ارشد', unit_price: 100000, is_active: true },
    { id: 8, category_id: 2, title: 'ثبت‌نام وام ازدواج و فرزندآوری', unit_price: 120000, is_active: true },
    { id: 9, category_id: 2, title: 'ثبت نام تعویض پلاک و نوبت‌دهی', unit_price: 50000, is_active: true },
    { id: 10, category_id: 3, title: 'ارسال اظهارنامه مالیاتی مشاغل', unit_price: 250000, is_active: true },
    { id: 11, category_id: 3, title: 'دریافت سوابق بیمه تامین اجتماعی', unit_price: 40000, is_active: true },
    { id: 12, category_id: 3, title: 'صدور فیش بیمه تامین اجتماعی', unit_price: 30000, is_active: true },
    { id: 13, category_id: 4, title: 'ثبت نام سامانه ثنا و احراز هویت', unit_price: 80000, is_active: true },
    { id: 14, category_id: 4, title: 'استعلام خلافی، عوارض و نمره منفی', unit_price: 35000, is_active: true },
    { id: 15, category_id: 4, title: 'دریافت ابلاغیه الکترونیک قضایی', unit_price: 30000, is_active: true },
    { id: 16, category_id: 5, title: 'تایپ فارسی (هر صفحه استاندارد)', unit_price: 25000, is_active: true },
    { id: 17, category_id: 5, title: 'صحافی سیمی و طلق (تا ۵۰ برگ)', unit_price: 40000, is_active: true },
    { id: 18, category_id: 6, title: 'کاور پلاستیکی A4 و پوشه', unit_price: 10000, is_active: true },
    { id: 19, category_id: 6, title: 'فلش مموری ۳۲ گیگابایت', unit_price: 320000, is_active: true },
  ],
  invoices: [],
  expenses: [],
  pendingOrders: [],
  settlements: [],
  settings: {
    name: 'کافی‌نت مرکزی',
    phone: '۰۲۱-۱۲۳۴۵۶۷۸',
    address: 'تهران، خیابان اصلی، پلاک ۱',
    invoice_footer_note: 'با تشکر از اعتماد شما - مدارک دریافتی تا ۴۸ ساعت معتبر می‌باشند.',
    default_settlement_model: 'total_share',
  },
  activeShiftId: null,
  activeUserId: null,
};

// بارگذاری دیتابیس از حافظه محلی
export function loadDatabase(): AppDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDatabase(INITIAL_DATABASE_STATE);
      return INITIAL_DATABASE_STATE;
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_DATABASE_STATE, ...parsed };
  } catch (error) {
    console.error('خطا در بارگذاری پایگاه داده محلی:', error);
    return INITIAL_DATABASE_STATE;
  }
}

// ذخیره قطعی دیتابیس
export function saveDatabase(data: AppDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('خطا در ذخیره پایگاه داده محلی:', error);
  }
}

// صدور فایل پشتیبان کامل JSON دیتابیس
export function exportDatabaseBackup(): void {
  const data = loadDatabase();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  a.href = url;
  a.download = `cafenet_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// بازیابی دیتابیس از فایل پشتیبان
export function restoreDatabaseBackup(file: File): Promise<AppDatabaseState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as AppDatabaseState;
        if (!parsed.users || !parsed.settings) {
          throw new Error('ساختار فایل پشتیبان نامعتبر است.');
        }
        saveDatabase(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsText(file);
  });
}
