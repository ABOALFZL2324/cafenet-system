const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

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

// راه‌اندازی سرور داخلی اختصاصی برای سرویس‌دهی آفلاین و پایدار
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
    let reqPath = req.url.split('?')[0];

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
      server.listen(0, '127.0.0.1');
    } else {
      console.error('خطای سرور:', err);
    }
  });

  server.listen(activePort, '127.0.0.1', () => {
    activePort = server.address().port;
    console.log(`سرور داخلی دسکتاپ بر روی پورت ${activePort} فعال شد.`);
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

app.on('before-quit', () => {
  isQuitting = true;
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
