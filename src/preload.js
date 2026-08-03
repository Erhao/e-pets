const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopDog', {
  ready: () => ipcRenderer.send('renderer-ready'),
  acknowledge: (id) => ipcRenderer.invoke('acknowledge-message', id),
  setInteractive: (enabled) => ipcRenderer.send('set-interactive', enabled),
  openConfig: () => ipcRenderer.send('open-config'),
  quit: () => ipcRenderer.send('quit-app'),
  onState: (callback) => ipcRenderer.on('state', (_event, state) => callback(state)),
  onCursor: (callback) => ipcRenderer.on('cursor', (_event, point) => callback(point))
});
