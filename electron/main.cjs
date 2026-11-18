const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

let server = null;
let mainWindow = null;
let tray = null;
let isQuitting = false;
let activePort = 35173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// دریافت مسیر آیکون رسمی برنامه
function getAppIconPath() {
  const icoPath = path.resolve(__dirname, '../build/icon.ico');
  if (fs.existsSync(icoPath)) return icoPath;
  const pngPath = path.resolve(__dirname, '../build/icon.png');
  if (fs.existsSync(pngPath)) return pngPath;
  return null;
}

// تعیین مسیر دائمی و مطمئن فایل پایگاه داده در پوشه داده‌های کاربر ویندوز (AppData)
function getDatabaseFilePath() {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'cafenet_db.json');
}

// ساخت آیکون و منوی سینی سیستم (کنار ساعت ویندوز)
function createSystemTray() {
  const iconPath = getAppIconPath();
  const trayIcon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();

  tray = new Tray(trayIcon);
  tray.setToolTip('سیستم جامع مدیریت کافی‌نت | در حال اجرا');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🖥️ نمایش پنجره اصلی برنامه',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      },
    },
    {
      label: '🔽 کوچک‌سازی به سینی سیستم (کنار ساعت)',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ خروج کامل از نرم‌افزار',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // با کلیک یا دابل‌کلیک روی آیکون کنار ساعت، پنجره فورا باز شود
  const showApp = () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  };

  tray.on('click', showApp);
  tray.on('double-click', showApp);
}

// استخراج آدرس‌های IP محلی سیستم در شبکه LAN
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// راه‌اندازی سرور داخلی اختصاصی برای سرویس‌دهی آفلاین، پایدار و شبکه محلی (LAN)
function startInternalServer(callback) {
  const DIST_DIR = path.resolve(__dirname, '../dist');
  const DB_FILE_PATH = getDatabaseFilePath();

  // در صورت نبود دیتابیس در AppData، داده‌های خام اولیه را کپی می‌کنیم
  if (!fs.existsSync(DB_FILE_PATH)) {
    const templateDbPath = path.resolve(__dirname, '../cafenet_db.json');
    if (fs.existsSync(templateDbPath)) {
      try {
        fs.copyFileSync(templateDbPath, DB_FILE_PATH);
      } catch (e) {
        console.error('خطا در کپی اولیه پایگاه داده:', e);
      }
    }
  }

  server = http.createServer((req, res) => {
    // هدرهای مجاز شبکه و CORS برای ارتباط کلاینت‌های دیگر در شبکه مغازه
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let reqPath = req.url.split('?')[0];

    // تست وضعیت سلامت و در دسترس بودن سرور شبکه
    if (reqPath === '/api/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', role: 'cafenet-server', version: '1.0.0' }));
      return;
    }

    // دریافت اطلاعات شبکه و آدرس‌های IP سیستم اصلی برای اتصال سیستم‌های دوم
    if (reqPath === '/api/network-info') {
      const ips = getLocalIpAddresses();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          port: activePort,
          ips: ips,
          primaryIp: ips[0] || '127.0.0.1',
          serverUrl: `http://${ips[0] || '127.0.0.1'}:${activePort}`,
        })
      );
      return;
    }

    // اندپوینت ذخیره و بازیابی دائمی اطلاعات در هارد دیسک
    if (reqPath === '/api/database') {
      if (req.method === 'GET') {
        if (fs.existsSync(DB_FILE_PATH)) {
          try {
            const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
            return;
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to read database' }));
            return;
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ notFound: true }));
          return;
        }
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            JSON.parse(body); // اعتبارسنجی ساختار JSON
            fs.writeFileSync(DB_FILE_PATH, body, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    // سرو فایل‌های فرانت‌اند
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.resolve(DIST_DIR, '.' + safePath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  // مدیریت خطای احتمالی اشغال بودن پورت با تخصیص هوشمند پورت آزاد
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('پورت پیش‌فرض اشغال است؛ در حال تخصیص پورت پویا...');
      server.listen(0, '0.0.0.0');
    } else {
      console.error('خطای سرور:', err);
    }
  });

  // گوش دادن به تمام کارت‌های شبکه (0.0.0.0) جهت دسترسی سایر سیستم‌های مغازه در شبکه LAN
  server.listen(activePort, '0.0.0.0', () => {
    activePort = server.address().port;
    console.log(`سرور شبکه محلی کافی‌نت بر روی پورت ${activePort} فعال شد.`);
    callback(activePort);
  });
}

function createWindow(port) {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 870,
    minWidth: 1024,
    minHeight: 700,
    title: 'سیستم جامع مدیریت کافی‌نت | CafeNet Manager',
    icon: iconPath || undefined,
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  // هنگام زدن ضربدر (بستن پنجره)، برنامه پنهان شده و کنار ساعت می‌رود تا شیفت و حساب‌ها قطع نشوند
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// قفل نمونه واحد (Single Instance Lock) - جلوگیری از باز شدن چندباره برنامه و بروز خطای EADDRINUSE
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // اگر نمونه‌ای از قبل باز است، این نمونه بسته شود
  app.quit();
} else {
  // اگر کاربر دوباره روی آیکون کلیک کرد، پنجره قبلی بالا آورده شود
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startInternalServer((port) => {
      createWindow(port);
      createSystemTray();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(activePort);
      }
    });
  });
}

// بستن خودکار شیفت فعال در هنگام خروج یا شات‌دان سیستم (Auto-End Shift on Shutdown)
function autoCloseActiveShiftOnExit(reason = 'خاموش شدن سیستم یا خروج از برنامه') {
  try {
    const dbPath = getDatabaseFilePath();
    if (!fs.existsSync(dbPath)) return;

    const raw = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(raw);

    let changed = false;
    const nowIso = new Date().toISOString();

    if (db.activeShiftId && Array.isArray(db.shifts)) {
      const shiftIdx = db.shifts.findIndex((s) => s.id === db.activeShiftId && s.status === 'active');
      if (shiftIdx !== -1) {
        const shift = db.shifts[shiftIdx];
        shift.end_time = nowIso;
        shift.status = 'closed';
        shift.handover_note = shift.handover_note
          ? `${shift.handover_note} | (${reason})`
          : `بسته شده خودکار به علت: ${reason}`;

        // محاسبه طول کارکرد شیفت به ساعت
        const startMs = new Date(shift.start_time).getTime();
        const endMs = new Date(nowIso).getTime();
        const diffHours = Math.max(0.01, Number(((endMs - startMs) / (1000 * 3600)).toFixed(2)));

        if (Array.isArray(shift.workers)) {
          shift.workers = shift.workers.map((w) => ({
            ...w,
            hours: w.hours !== undefined ? w.hours : diffHours,
          }));
        }

        db.activeShiftId = null;
        changed = true;
        console.log(`شیفت فعال (شناسه ${shift.id}) به طور خودکار بسته و ذخیره شد.`);
      }
    }

    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(db), 'utf-8');
    }
  } catch (err) {
    console.error('خطا در بستن خودکار شیفت:', err);
  }
}

app.on('before-quit', () => {
  isQuitting = true;
  autoCloseActiveShiftOnExit('خاموش شدن سیستم یا خروج کامل از برنامه');
});

app.on('will-quit', () => {
  autoCloseActiveShiftOnExit('خاموش شدن سیستم ویندوز');
});

app.on('window-all-closed', () => {
  if (server) {
    try {
      server.close();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
