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
  if (!value) return 0;
  // پاکسازی و تبدیل ارقام فارسی و عربی به انگلیسی
  let cleaned = value.trim()
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    .replace(/[^0-9]/g, '');

  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
