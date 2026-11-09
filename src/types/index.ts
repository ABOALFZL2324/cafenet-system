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
  created_at: string;
}

export interface Shift {
  id: number;
  user_id: number;
  user_name?: string;
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

export type SettlementModel = 'total_share' | 'individual_performance';

export interface MonthlySettlementRecord {
  id: number;
  jalali_year: number;
  jalali_month: number;
  settlement_model: SettlementModel;
  total_income: number;
  total_expense: number;
  net_profit: number;
  details: {
    user_id: number;
    user_name: string;
    profit_percentage: number;
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
}
