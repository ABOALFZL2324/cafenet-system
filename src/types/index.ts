// مدل‌ها و تایپ‌های بنیادین سیستم مدیریت کافی‌نت
// برگرفته از سند رسمی model.md

export type UserRole = 'admin' | 'operator';

export interface User {
  id: number;
  username: string;
  pin_code: string; // پین‌کد عددی ۴ رقمی برای ورود سریع
  full_name: string;
  role: UserRole;
  profit_percentage: number; // درصد سهم از سود (مثلا ۳۰)
  is_active: boolean;
  is_deleted?: boolean; // حذف منطقی (Soft Delete) جهت محافظت ۱۰۰٪ از سوابق تراکنش‌ها
  deleted_at?: string;
  created_at: string;
}

export interface ShiftWorker {
  user_id: number;
  user_name: string;
  hours?: number; // تعداد ساعات کارکرد ثبت‌شده در این شیفت
}

export interface Shift {
  id: number;
  user_id: number; // کاربر بازکننده یا متصدی مسئول شیفت
  user_name?: string;
  workers?: ShiftWorker[]; // کارگران و پرسنل همزمان حاضر در این شیفت
  start_time: string; // ISO String
  end_time: string | null;
  handover_note?: string; // یادداشت تحویل شیفت
  status: 'active' | 'closed';
}

export interface ServiceCategory {
  id: number;
  name: string; // نام دسته: مثلا پرینت و تکثیر، ثبت‌نام، تایپ و اسکن، فروش کالا
  is_active: boolean;
}

export interface ServiceItem {
  id: number;
  category_id: number;
  category_name?: string;
  title: string; // مثلا: پرینت دورو سیاه سفید، ثبت نام کنکور
  unit_price: number; // قیمت مصوب به تومان
  is_active: boolean;
}

export type PaymentMethod = 'cash' | 'pos';

export interface InvoiceItem {
  id: string; // شناسه محلی قلم فاکتور
  service_id: number;
  service_title: string;
  category_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: number;
  invoice_number: string; // مثلا: INV-140308-001
  shift_id: number;
  user_id: number;
  user_name?: string;
  customer_name?: string;
  customer_phone?: string;
  items: InvoiceItem[];
  total_amount: number;
  discount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface Expense {
  id: number;
  shift_id: number;
  user_id: number;
  user_name?: string;
  title: string; // مثلا: خرید کاغذ A4، تعمیر پرینتر، چای و قند
  amount: number;
  payment_method: PaymentMethod;
  description?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered';

export interface PendingOrder {
  id: number;
  created_by_user_id: number;
  created_by_name?: string;
  customer_name: string;
  customer_phone: string;
  title: string; // شرح کار
  details?: string; // توضیحات و مدارک امانی
  estimated_amount: number; // مبلغ برآورد کل
  prepayment_amount: number; // بیعانه دریافت شده
  status: OrderStatus;
  due_date?: string; // تاریخ تحویل / سررسید
  created_at: string;
}

export type SettlementModel = 'total_share' | 'individual_performance' | 'hourly_attendance';

export interface MonthlySettlementRecord {
  id: number;
  jalali_year: number;
  jalali_month: number;
  settlement_model: SettlementModel;
  total_income: number;
  total_expense: number;
  net_profit: number;
  employer_percentage?: number; // درصد سهم کارفرما (در مدل تسویه ساعتی)
  employer_amount?: number; // مبلغ ریالی سهم کارفرما (تومان)
  total_workers_hours?: number; // مجموع ساعات کارکرد همه پرسنل در این ماه
  hourly_rate_budget?: number; // ارزش ریالی هر ساعت کارکرد پرسنل در این ماه
  details: {
    user_id: number;
    user_name: string;
    profit_percentage: number;
    hours_worked?: number; // مجموع ساعت کارکرد در این ماه (مثلاً ۱۲۴.۵ ساعت)
    hourly_share_amount?: number; // سهم حاصل از ساعت کارکرد
    user_income: number;
    user_allocated_expense: number;
    user_net_profit: number;
    user_share_amount: number;
  }[];
  settled_by_user_id: number;
  settled_by_name?: string;
  is_settled: boolean;
  settled_at: string;
}

export interface CafeNetSettings {
  name: string; // نام کافی‌نت
  phone: string; // تلفن
  address: string; // آدرس
  logo_url?: string; // تصویر لوگوی کافی‌نت به صورت Base64
  invoice_footer_note: string; // متن پیام پایین فاکتور
  default_settlement_model: SettlementModel;
  default_employer_percentage?: number; // درصد پیش‌فرض کارفرما در مدل ساعتی (مثلاً ۵۰)
  is_initialized?: boolean; // وضعیت راه‌اندازی اولیه سیستم (خام یا فعال)
}
