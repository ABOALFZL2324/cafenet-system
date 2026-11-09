import jalaali from 'jalaali-js';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const WEEK_DAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

export interface JalaliDateObj {
  year: number;
  month: number; // 1 to 12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function toJalali(dateInput: Date | string | number = new Date()): JalaliDateObj {
  const d = new Date(dateInput);
  const j = jalaali.toJalaali(d);
  return {
    year: j.jy,
    month: j.jm,
    day: j.jd,
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
  };
}

export function formatJalaliDate(dateInput: Date | string | number = new Date()): string {
  const j = toJalali(dateInput);
  const pad = (n: number) => n.toString().padStart(2, '۰');
  return `${j.year}/${pad(j.month)}/${pad(j.day)}`;
}

export function formatJalaliTime(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatJalaliDateTime(dateInput: Date | string | number = new Date()): string {
  const dateStr = formatJalaliDate(dateInput);
  const timeStr = formatJalaliTime(dateInput);
  return `${dateStr} - ${timeStr}`;
}

export function getFullJalaliString(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  const dayName = WEEK_DAYS_FA[d.getDay()];
  const j = toJalali(d);
  const monthName = JALALI_MONTH_NAMES[j.month - 1];
  return `${dayName}، ${j.day} ${monthName} ${j.year}`;
}

// بررسی اینکه آیا یک تاریخ در ماه و سال شمسی مشخصی قرار دارد یا خیر
export function isInJalaliMonth(
  dateInput: Date | string | number,
  targetYear: number,
  targetMonth: number
): boolean {
  const j = toJalali(dateInput);
  return j.year === targetYear && j.month === targetMonth;
}
