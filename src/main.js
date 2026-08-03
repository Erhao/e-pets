const path = require('node:path');
const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu, nativeImage } = require('electron');
const { loadConfig } = require('./config');
const { MessageStore } = require('./message-store');
const { createMessageServer } = require('./message-server');

let win, tray, store, config, configPath, server, cursorTimer;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

function sendState() {
  if (win && !win.isDestroyed()) win.webContents.send('state', { config, messages: store.list() });
}

function createWindow() {
  const area = screen.getPrimaryDisplay().bounds;
  win = new BrowserWindow({
    ...area, transparent: true, frame: false, resizable: false, movable: false,
    alwaysOnTop: config.window.alwaysOnTop, skipTaskbar: !config.window.showInTaskbar,
    focusable: true, hasShadow: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setAlwaysOnTop(config.window.alwaysOnTop, 'floating');
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.showInactive());
  cursorTimer = setInterval(() => {
    if (!win.isDestroyed()) {
      const point = screen.getCursorScreenPoint();
      win.webContents.send('cursor', { x: point.x - area.x, y: point.y - area.y });
    }
  }, 100);
}

function createTray() {
  const icon = nativeImage.createFromDataURL('data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="17" r="12" fill="#b56f38"/><circle cx="12" cy="14" r="2"/><circle cx="20" cy="14" r="2"/><path d="M13 20q3 3 6 0" fill="none" stroke="#fff" stroke-width="2"/><path d="M7 8L2 2v13M25 8l5-6v13" fill="#7a4529"/></svg>').toString('base64'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip(`${config.pet.name} - 桌面小狗`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开配置文件', click: () => shell.openPath(configPath) },
    { label: '重新加载界面', click: () => win.reload() },
    { type: 'separator' }, { label: '退出', click: () => app.quit() }
  ]));
}

app.whenReady().then(() => {
  ({ config, userPath: configPath } = loadConfig(app.getAppPath(), app.getPath('userData')));
  store = new MessageStore(path.join(app.getPath('userData'), 'messages.json'));
  app.setLoginItemSettings({ openAtLogin: !!config.window.launchAtStartup });
  createWindow(); createTray();
  server = createMessageServer({ store, config: config.server, onChange: sendState });
  server.on('error', (error) => console.error(`消息服务启动失败: ${error.message}`));
  server.listen(config.server.port, config.server.host, () => console.log(`消息服务: http://${config.server.host}:${config.server.port}`));
});

ipcMain.on('renderer-ready', sendState);
ipcMain.on('set-interactive', (_event, enabled) => win?.setIgnoreMouseEvents(!enabled, { forward: true }));
ipcMain.handle('acknowledge-message', (_event, id) => { const result = store.acknowledge(id); sendState(); return !!result; });
ipcMain.on('open-config', () => shell.openPath(configPath));
ipcMain.on('quit-app', () => app.quit());
app.on('before-quit', () => { clearInterval(cursorTimer); server?.close(); });
app.on('window-all-closed', (event) => event.preventDefault());
