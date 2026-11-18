// توابع کمکی هوشمند متن و جستجوی روان فارسی (Smart Text Normalization)

/**
 * یکسان‌سازی کاراکترهای فارسی و عربی جهت جستجوی بدون خطا
 * پشتیبانی از ک/ی عربی، نیم‌فاصله، تشدید و فاصله‌های مجازی
 */
export function normalizePersianText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // تبدیل ی و ک عربی
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/إ|أ|آ/g, 'ا')
    // حذف اعراب و تنوین
    .replace(/[\u064B-\u0652]/g, '')
    // یکسان‌سازی نیم‌فاصله و فاصله‌های نامرئی با فاصله معمولی
    .replace(/[\u200C\u200B\u200E\u200F\u00A0]/g, ' ')
    // حذف فاصله‌های متوالی
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * بررسی تطابق هوشمند عبارت جستجو با متن هدف
 */
export function matchesFuzzyPersian(target: string, query: string): boolean {
  if (!query) return true;
  const normTarget = normalizePersianText(target);
  const normQuery = normalizePersianText(query);

  // بررسی مستقیم شامل بودن
  if (normTarget.includes(normQuery)) return true;

  // بررسی بدون هیچ فاصله‌ای (برای کلماتی مثل "ثبت نام" و "ثبت‌نام")
  const compactTarget = normTarget.replace(/\s/g, '');
  const compactQuery = normQuery.replace(/\s/g, '');
  if (compactTarget.includes(compactQuery)) return true;

  // بررسی کلمه به کلمه (تک‌تک کلمات سرچ در هدف وجود داشته باشند)
  const queryTokens = normQuery.split(' ').filter(Boolean);
  return queryTokens.every((token) => normTarget.includes(token));
}
