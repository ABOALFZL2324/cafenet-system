// ابزارهای فرمت و تبدیل مبالغ مالی

export function formatToman(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '۰ تومان';
  const formatted = Math.round(amount).toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '۰';
  return Math.round(num).toLocaleString('fa-IR');
}

export function parseTomanInput(value: string): number {
  // پاکسازی کاراکترهای غیرعددی (شامل کاما، حروف و ارقام فارسی به انگلیسی)
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let cleaned = value.trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replace(new RegExp(persianDigits[i], 'g'), i.toString());
  }
  cleaned = cleaned.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
