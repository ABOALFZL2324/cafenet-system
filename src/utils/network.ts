// ماژول مدیریت شبکه محلی و همگام‌سازی چند سیستمی (LAN Multi-PC Sync)

const STORAGE_MODE_KEY = 'cafenet_system_role_mode'; // 'server' | 'client'
const STORAGE_HOST_KEY = 'cafenet_remote_server_host'; // e.g. "http://192.168.1.100:35173"

export interface NetworkInfoResponse {
  port: number;
  ips: string[];
  primaryIp: string;
  serverUrl: string;
}

/**
 * آیا این سیستم به عنوان کلاینت (سیستم دوم) به سیستم اصلی متصل است؟
 */
export function isClientMode(): boolean {
  return localStorage.getItem(STORAGE_MODE_KEY) === 'client';
}

/**
 * دریافت آدرس پایه سرور جهت ارسال درخواست‌های دیتابیس
 */
export function getServerBaseUrl(): string {
  if (isClientMode()) {
    const remoteHost = localStorage.getItem(STORAGE_HOST_KEY);
    if (remoteHost) {
      return remoteHost.replace(/\/+$/, '');
    }
  }
  return '';
}

/**
 * ذخیره تنظیمات نقش سیستم در شبکه محلی
 */
export function setNetworkRoleConfig(mode: 'server' | 'client', remoteHost?: string): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
  if (mode === 'client' && remoteHost) {
    let cleanHost = remoteHost.trim();
    if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
      cleanHost = 'http://' + cleanHost;
    }
    // اگر پورت تعیین نشده بود، پورت پیش‌فرض 35173 اضافه شود
    if (!cleanHost.match(/:\d+$/)) {
      cleanHost = cleanHost + ':35173';
    }
    localStorage.setItem(STORAGE_HOST_KEY, cleanHost);
  } else {
    localStorage.removeItem(STORAGE_HOST_KEY);
  }
}

/**
 * تست در دسترس بودن و سلامت ارتباط با سیستم اصلی
 */
export async function testServerConnection(host: string): Promise<{ success: boolean; message: string; version?: string }> {
  try {
    let cleanHost = host.trim();
    if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
      cleanHost = 'http://' + cleanHost;
    }
    if (!cleanHost.match(/:\d+$/)) {
      cleanHost = cleanHost + ':35173';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${cleanHost}/api/ping`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        return {
          success: true,
          message: 'ارتباط با سیستم اصلی (سرور دیتابیس) با موفقیت برقرار شد.',
          version: data.version,
        };
      }
    }
    return { success: false, message: 'پاسخ دریافتی از آدرس وارد شده معتبر نیست.' };
  } catch (err: any) {
    return {
      success: false,
      message: 'عدم امکان اتصال به سیستم اصلی. لطفاً از اتصال هر دو کامپیوتر به یک مودم و باز بودن برنامه در سیستم اصلی اطمینان حاصل کنید.',
    };
  }
}

/**
 * دریافت اطلاعات آی‌پی محلی سیستم فعلی (برای سیستم اصلی)
 */
export async function fetchLocalNetworkInfo(): Promise<NetworkInfoResponse | null> {
  try {
    const res = await fetch('/api/network-info');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('عدم امکان دریافت مشخصات کارت شبکه از سیستم عامل:', err);
  }
  return null;
}
