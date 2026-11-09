// ماژول امنیت سایبری، رمزنگاری و اعتبارسنجی داده‌ها
// Cyber Security & Cryptographic Integrity Module

const PIN_SALT = 'CafeNet_Secure_Salt_2026_!#@';

// هش کردن ایمن پین‌کد با استفاده از Web Crypto API استاندارد (SHA-256)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + PIN_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// هش سریع همگام برای مقایسه اول دوره
export function quickHash(str: string): string {
  let hash = 0;
  const combined = str + PIN_SALT;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

// ضدعفونی‌سازی ورودی‌ها جهت جلوگیری از XSS و تزریق کد (Input Sanitization)
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// سیستم محافظت در برابر حملات جستجوی فراگیر پین (Anti-Brute-Force Rate Limiter)
interface AttemptRecord {
  failedAttempts: number;
  lockedUntil: number | null;
}

const attemptRegistry: { [key: string]: AttemptRecord } = {};

export function checkLoginAttempts(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = attemptRegistry[identifier];

  if (!record) return { allowed: true };

  if (record.lockedUntil && now < record.lockedUntil) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // اگر زمان قفل گذشته باشد
  if (record.lockedUntil && now >= record.lockedUntil) {
    record.failedAttempts = 0;
    record.lockedUntil = null;
  }

  return { allowed: true };
}

export function recordFailedAttempt(identifier: string): { locked: boolean; waitSeconds?: number } {
  const now = Date.now();
  if (!attemptRegistry[identifier]) {
    attemptRegistry[identifier] = { failedAttempts: 1, lockedUntil: null };
  } else {
    attemptRegistry[identifier].failedAttempts += 1;
  }

  const record = attemptRegistry[identifier];

  // اگر بیش از ۴ بار متوالی اشتباه وارد شود -> ۳۰ ثانیه قفل
  if (record.failedAttempts >= 4) {
    const lockDuration = 30 * 1000;
    record.lockedUntil = now + lockDuration;
    return { locked: true, waitSeconds: 30 };
  }

  return { locked: false };
}

export function resetFailedAttempts(identifier: string): void {
  delete attemptRegistry[identifier];
}

// محاسبه امضای چک‌سام فایل پشتیبان جهت جلوگیری از دستکاری دستی (Tamper Detection)
export function generateBackupChecksum(payload: string): string {
  let hash = 0;
  const salted = payload + PIN_SALT + '_IntegrityCheck';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'SIG_' + Math.abs(hash).toString(16);
}

export function verifyBackupChecksum(payload: string, providedChecksum: string): boolean {
  const expected = generateBackupChecksum(payload);
  return expected === providedChecksum;
}
