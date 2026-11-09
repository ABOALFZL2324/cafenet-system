const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'سیستم جامع مدیریت کافی‌نت | CafeNet Manager',
    autoHideMenuBar: true,
    backgroundColor: '#f3f3f3',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // در حالت توسعه یا بیلد
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
