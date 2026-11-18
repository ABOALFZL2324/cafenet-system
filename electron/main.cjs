const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let server = null;
const PORT = 35173; // پورت اختصاصی داخلی نرم‌افزار

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

// تعیین مسیر دائمی و مطمئن فایل پایگاه داده در پوشه داده‌های کاربر ویندوز (AppData)
function getDatabaseFilePath() {
  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return path.join(userDataDir, 'cafenet_db.json');
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

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`سرور داخلی دسکتاپ بر روی پورت ${PORT} آماده است.`);
    callback();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 870,
    minWidth: 1024,
    minHeight: 700,
    title: 'سیستم جامع مدیریت کافی‌نت | CafeNet Manager',
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);
}

app.whenReady().then(() => {
  startInternalServer(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
