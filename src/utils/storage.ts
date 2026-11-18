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

// داده‌های اولیه استاندارد و خام کافی‌نت برای راه‌اندازی گام‌به‌گام (Onboarding)
export const INITIAL_DATABASE_STATE: AppDatabaseState = {
  users: [],
  shifts: [],
  serviceCategories: [
    { id: 1, name: 'چاپ، تکثیر و اسکن', is_active: true },
    { id: 2, name: 'ثبت‌نام‌های اینترنتی و آزمون‌ها', is_active: true },
    { id: 3, name: 'خدمات مالیاتی، بیمه و بازنشستگی', is_active: true },
    { id: 4, name: 'خدمات قضایی، انتظامی و خلافی', is_active: true },
    { id: 5, name: 'تایپ، ترجمه، صحافی و دانشجویی', is_active: true },
    { id: 6, name: 'لوازم جانبی کامپیوتر و تحریر', is_active: true },
  ],
  services: [],
  invoices: [],
  expenses: [],
  pendingOrders: [],
  settlements: [],
  settings: {
    name: '',
    phone: '',
    address: '',
    invoice_footer_note: 'با تشکر از اعتماد شما - مدارک دریافتی تا ۴۸ ساعت معتبر می‌باشند.',
    default_settlement_model: 'total_share',
    default_employer_percentage: 50,
    is_initialized: false,
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

// ذخیره قطعی دیتابیس (همگام‌سازی همزمان در localStorage و فایل فیزیکی هارد دیسک)
export function saveDatabase(data: AppDatabaseState): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);

    // همگام‌سازی فوری و پایدار با سرور داخلی و نوشتن در فایل cafenet_db.json هارد دیسک
    if (typeof fetch !== 'undefined') {
      fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      }).catch((err) => {
        // در صورت عدم دسترسی موقت به سرور، داده در localStorage محفوظ است
        console.warn('عدم همگام‌سازی فایل هارد دیسک:', err);
      });
    }
  } catch (error) {
    console.error('خطا در ذخیره پایگاه داده محلی:', error);
  }
}

// همگام‌سازی اولیه دیتابیس از روی فایل فیزیکی دیسک سخت
export async function syncDatabaseWithDisk(): Promise<AppDatabaseState | null> {
  try {
    if (typeof fetch === 'undefined') return null;
    const res = await fetch('/api/database');
    if (res.ok) {
      const diskData = await res.json();
      if (diskData && diskData.users && Array.isArray(diskData.users)) {
        const merged: AppDatabaseState = { ...INITIAL_DATABASE_STATE, ...diskData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.warn('امکان اتصال به فایل دیسک در استارت‌آپ وجود ندارد:', err);
  }
  return null;
}

import { generateBackupChecksum, verifyBackupChecksum } from './security';

// صدور فایل پشتیبان کامل JSON دیتابیس با امضای دیجیتال
export function exportDatabaseBackup(): void {
  const data = loadDatabase();
  const rawDataStr = JSON.stringify(data);
  const checksum = generateBackupChecksum(rawDataStr);
  const backupEnvelope = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    checksum,
    database: data,
  };

  const jsonStr = JSON.stringify(backupEnvelope, null, 2);
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

// بازیابی دیتابیس از فایل پشتیبان با بررسی صحت و امضای دیجیتال
export function restoreDatabaseBackup(file: File): Promise<AppDatabaseState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        let targetData: AppDatabaseState;

        // اگر فایل پاکت دارای امضای دیجیتال باشد
        if (parsed.checksum && parsed.database) {
          const rawPayload = JSON.stringify(parsed.database);
          const isValid = verifyBackupChecksum(rawPayload, parsed.checksum);
          if (!isValid) {
            throw new Error('هشدار امنیتی: امضای دیجیتال فایل پشتیبان معتبر نیست؛ ممکن است فایل دستکاری شده باشد.');
          }
          targetData = parsed.database;
        } else if (parsed.users && parsed.settings) {
          // نسخه قدیمی بدون پاکت
          targetData = parsed;
        } else {
          throw new Error('ساختار فایل پشتیبان نامعتبر است.');
        }

        saveDatabase(targetData);
        resolve(targetData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsText(file);
  });
}

// ریست کردن کل سیستم به حالت خام کارخانه برای راه‌اندازی مجدد
export function resetDatabaseToCleanSlate(): void {
  saveDatabase(INITIAL_DATABASE_STATE);
}
