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
  const modelName =
    settlement.settlement_model === 'total_share'
      ? 'شراکتی از سود کل'
      : settlement.settlement_model === 'individual_performance'
      ? 'پورسانت عملکردی فردی'
      : 'بر پایه ساعت کارکرد حضور و سهم کارفرما';

  const summaryRows: { 'شاخص مالی': string; 'مقدار': string | number }[] = [
    { 'شاخص مالی': 'سال و ماه شمسی', 'مقدار': `${settlement.jalali_year}/${settlement.jalali_month}` },
    { 'شاخص مالی': 'مدل تسویه حساب', 'مقدار': modelName },
    { 'شاخص مالی': 'مجموع درآمد واقعی ماه (تومان)', 'مقدار': settlement.total_income },
    { 'شاخص مالی': 'مجموع هزینه‌های مغازه (تومان)', 'مقدار': settlement.total_expense },
    { 'شاخص مالی': 'سود خالص واقعی ماه (تومان)', 'مقدار': settlement.net_profit },
  ];

  if (settlement.settlement_model === 'hourly_attendance') {
    summaryRows.push(
      { 'شاخص مالی': 'درصد سهم کارفرما (%)', 'مقدار': settlement.employer_percentage || 0 },
      { 'شاخص مالی': 'مبلغ سهم کارفرما (تومان)', 'مقدار': settlement.employer_amount || 0 },
      { 'شاخص مالی': 'مجموع ساعت کارکرد پرسنل (ساعت)', 'مقدار': settlement.total_workers_hours || 0 },
      { 'شاخص مالی': 'ارزش ریالی هر ساعت کارکرد (تومان)', 'مقدار': settlement.hourly_rate_budget || 0 }
    );
  }

  summaryRows.push({ 'شاخص مالی': 'تایید شده توسط', 'مقدار': settlement.settled_by_name || 'مدیریت' });

  const detailRows =
    settlement.settlement_model === 'hourly_attendance'
      ? settlement.details.map((d, idx) => ({
          'ردیف': idx + 1,
          'نام متصدی / کارگر': d.user_name,
          'ساعت کارکرد در ماه (ساعت)': d.hours_worked || 0,
          'ارزش هر ساعت کار (تومان)': settlement.hourly_rate_budget || 0,
          'درآمد تولیدی در شیفت‌ها (تومان)': d.user_income,
          'مبلغ دستمزد نهایی پرداختی (تومان)': d.user_share_amount,
        }))
      : settlement.details.map((d, idx) => ({
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

export interface ParsedExcelService {
  category: string;
  title: string;
  unit_price: number;
}

// دانلود فایل اکسل قالب خام برای تعریف نرخ‌نامه خدمات توسط صاحب کافی‌نت
export function downloadServicesTemplateExcel(): void {
  const templateRows = [
    {
      'دسته‌بندی': 'چاپ و تکثیر',
      'عنوان خدمت': 'پرینت تک‌رو سیاه سفید (A4)',
      'نرخ مصوب (تومان)': 3000,
    },
    {
      'دسته‌بندی': 'چاپ و تکثیر',
      'عنوان خدمت': 'پرینت دورو سیاه سفید (A4)',
      'نرخ مصوب (تومان)': 5000,
    },
    {
      'دسته‌بندی': 'چاپ و تکثیر',
      'عنوان خدمت': 'پرینت رنگی (A4)',
      'نرخ مصوب (تومان)': 15000,
    },
    {
      'دسته‌بندی': 'ثبت‌نام‌های اینترنتی',
      'عنوان خدمت': 'ثبت‌نام آزمون کنکور سراسری',
      'نرخ مصوب (تومان)': 100000,
    },
    {
      'دسته‌بندی': 'ثبت‌نام‌های اینترنتی',
      'عنوان خدمت': 'ثبت‌نام قرعه‌کشی خودرو',
      'نرخ مصوب (تومان)': 150000,
    },
    {
      'دسته‌بندی': 'خدمات مالیاتی و بیمه',
      'عنوان خدمت': 'ارسال اظهارنامه مالیاتی مشاغل',
      'نرخ مصوب (تومان)': 250000,
    },
    {
      'دسته‌بندی': 'خدمات مالیاتی و بیمه',
      'عنوان خدمت': 'صدور فیش بیمه تامین اجتماعی',
      'نرخ مصوب (تومان)': 30000,
    },
    {
      'دسته‌بندی': 'خدمات قضایی و انتظامی',
      'عنوان خدمت': 'ثبت‌نام سامانه ثنا و احراز هویت',
      'نرخ مصوب (تومان)': 80000,
    },
    {
      'دسته‌بندی': 'خدمات قضایی و انتظامی',
      'عنوان خدمت': 'استعلام خلافی خودرو و پرداخت',
      'نرخ مصوب (تومان)': 35000,
    },
    {
      'دسته‌بندی': 'تایپ، صحافی و دانشجویی',
      'عنوان خدمت': 'تایپ فارسی هر صفحه استاندارد',
      'نرخ مصوب (تومان)': 25000,
    },
    {
      'دسته‌بندی': 'تایپ، صحافی و دانشجویی',
      'عنوان خدمت': 'صحافی فنری با طلق (تا ۵۰ برگ)',
      'نرخ مصوب (تومان)': 40000,
    },
    {
      'دسته‌بندی': 'لوازم جانبی و متفرقه',
      'عنوان خدمت': 'کاور پلاستیکی A4',
      'نرخ مصوب (تومان)': 10000,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نرخ‌نامه_خدمات');
  XLSX.writeFile(workbook, 'قالب_نرخ_نامه_خدمات_کافی_نت.xlsx');
}

import { parseTomanInput } from './currency';

// پارس کردن و استخراج خدمات از فایل اکسل بارگذاری‌شده توسط صاحب کافی‌نت
export function parseServicesExcelFile(file: File): Promise<ParsedExcelService[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('فایل اکسل فاقد برگه (Sheet) است.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('فایل اکسل خالی است یا سطری در آن یافت نشد.');
        }

        const results: ParsedExcelService[] = [];

        for (const row of rawJson) {
          let category = '';
          let title = '';
          let rawPrice: any = 0;

          for (const key of Object.keys(row)) {
            const k = key.trim().toLowerCase();
            const val = row[key];

            if (k.includes('دسته') || k === 'category' || k === 'cat') {
              category = String(val).trim();
            } else if (k.includes('عنوان') || k.includes('خدمت') || k === 'title' || k === 'name' || k === 'service') {
              title = String(val).trim();
            } else if (k.includes('نرخ') || k.includes('قیمت') || k.includes('مبلغ') || k === 'price' || k === 'cost') {
              rawPrice = val;
            }
          }

          let price = 0;
          if (typeof rawPrice === 'number') {
            price = Math.round(rawPrice);
          } else if (typeof rawPrice === 'string') {
            price = parseTomanInput(rawPrice);
          }

          if (title && price >= 0) {
            results.push({
              category: category || 'عمومی و متفرقه',
              title,
              unit_price: price,
            });
          }
        }

        if (results.length === 0) {
          throw new Error('ستون‌های عنوان خدمت یا نرخ مصوب در فایل اکسل شناسایی نشدند. لطفاً از قالب استاندارد استفاده کنید.');
        }

        resolve(results);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('خطا در خواندن فایل اکسل.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
