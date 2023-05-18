const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    setSize: (height) => ipcRenderer.send('set-size', height)
});