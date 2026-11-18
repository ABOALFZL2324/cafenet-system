const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5173;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// هدرهای امنیتی استاندارد OWASP
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:;",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // اندپوینت اختصاصی ذخیره و بازیابی دائمی دیتابیس روی هارد دیسک ویندوز
  if (reqPath === '/api/database') {
    const DB_FILE_PATH = path.resolve(__dirname, 'cafenet_db.json');

    if (req.method === 'GET') {
      if (fs.existsSync(DB_FILE_PATH)) {
        try {
          const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS });
          res.end(fileContent);
          return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Failed to read database file' }));
          return;
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify({ notFound: true }));
        return;
      }
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 50 * 1024 * 1024) {
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          // اعتبارسنجی ساختار قبل از ذخیره فیزیکی
          JSON.parse(body);
          fs.writeFileSync(DB_FILE_PATH, body, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Method Not Allowed');
    return;
  }

  // محدود کردن متدهای مجاز برای فایل‌های استاتیک
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Method Not Allowed');
    return;
  }
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // اعتبارسنجی قطعی در برابر حملات Path Traversal
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.resolve(DIST_DIR, '.' + safePath);

  // اطمینان از اینکه فایل حتماً داخل پوشه dist قرار دارد
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Access Denied');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      ...SECURITY_HEADERS,
    });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`سامانه مدیریت کافی‌نت با حفاظت امنیتی بالا فعال است.`);
  console.log(`آدرس محلی: http://127.0.0.1:${PORT}`);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  // باز کردن پنجره اختصاصی ویندوز (بدون نوار ابزار و تب)
  if (fs.existsSync(edgePath)) {
    exec(`"${edgePath}" --app=http://127.0.0.1:${PORT} --window-size=1280,850`);
  } else if (fs.existsSync(chromePath)) {
    exec(`"${chromePath}" --app=http://127.0.0.1:${PORT} --window-size=1280,850`);
  } else {
    exec(`explorer "http://127.0.0.1:${PORT}"`);
  }
});
