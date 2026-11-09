import * as XLSX from 'xlsx';
import { Invoice, Expense, MonthlySettlementRecord } from '../types';
import { formatJalaliDateTime } from './jalali';

// خروجی اکسل فاکتورها و درآمدهای ماه
export function exportInvoicesToExcel(invoices: Invoice[], fileName = 'گزارش_درآمدهای_کافی‌نت'): void {
  const rows = invoices.map((inv, idx) => ({
    'ردیف': idx + 1,
    'شماره فاکتور': inv.invoice_number,
    'تاریخ و ساعت': formatJalaliDateTime(inv.created_at),
    'متصدی ثبت': inv.user_name || '-',
    'نام مشتری': inv.customer_name || 'مشتری عمومی',
    'شماره تماس': inv.customer_phone || '-',
    'شرح اقلام': inv.items.map((i) => `${i.service_title} (${i.quantity} عدد)`).join(' | '),
    'مبلغ کل (تومان)': inv.total_amount,
    'تخفیف (تومان)': inv.discount,
    'مبلغ نهایی دریافتی (تومان)': inv.final_amount,
    'روش پرداخت': inv.payment_method === 'cash' ? 'نقدی' : 'کارتخوان',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'درآمدها');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// خروجی اکسل هزینه‌های مغازه
export function exportExpensesToExcel(expenses: Expense[], fileName = 'گزارش_هزینه‌های_مغازه'): void {
  const rows = expenses.map((exp, idx) => ({
    'ردیف': idx + 1,
    'عنوان هزینه': exp.title,
    'مبلغ (تومان)': exp.amount,
    'روش پرداخت': exp.payment_method === 'cash' ? 'صندوق نقدی' : 'کارتخوان / بانکی',
    'متصدی ثبت': exp.user_name || '-',
    'توضیحات': exp.description || '-',
    'تاریخ و ساعت': formatJalaliDateTime(exp.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'هزینه‌ها');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// خروجی اکسل گزارش تسویه ماهانه
export function exportSettlementToExcel(settlement: MonthlySettlementRecord): void {
  const summaryRows = [
    { 'شاخص مالی': 'سال و ماه شمسی', 'مقدار': `${settlement.jalali_year}/${settlement.jalali_month}` },
    { 'شاخص مالی': 'مدل تسویه حساب', 'مقدار': settlement.settlement_model === 'total_share' ? 'شراکتی از سود کل' : 'پورسانت عملکردی فردی' },
    { 'شاخص مالی': 'مجموع درآمد واقعی ماه (تومان)', 'مقدار': settlement.total_income },
    { 'شاخص مالی': 'مجموع هزینه‌های مغازه (تومان)', 'مقدار': settlement.total_expense },
    { 'شاخص مالی': 'سود خالص واقعی ماه (تومان)', 'مقدار': settlement.net_profit },
    { 'شاخص مالی': 'تایید شده توسط', 'مقدار': settlement.settled_by_name || 'مدیریت' },
  ];

  const detailRows = settlement.details.map((d, idx) => ({
    'ردیف': idx + 1,
    'نام متصدی': d.user_name,
    'درصد مصوب (%)': d.profit_percentage,
    'درآمد ایجاد شده (تومان)': d.user_income,
    'سهم هزینه تخصیص‌یافته (تومان)': d.user_allocated_expense,
    'سود خالص متصدی (تومان)': d.user_net_profit,
    'مبلغ قابل پرداخت نهایی (تومان)': d.user_share_amount,
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetails = XLSX.utils.json_to_sheet(detailRows);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'خلاصه_مالی_ماه');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'سهم_پرسنل');

  XLSX.writeFile(wb, `تسویه_ماه_${settlement.jalali_year}_${settlement.jalali_month}.xlsx`);
}
