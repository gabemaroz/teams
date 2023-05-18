const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');
const defaultWidth = 320;

if (require('electron-squirrel-startup')) {
  app.quit();
}

function handleSetSize(event, height) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setSize(defaultWidth, height);
}


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    minWidth: defaultWidth,
    minHeight: 150,
    width: defaultWidth,
    height: 150,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setAlwaysOnTop(true, 'floating');

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  //mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  ipcMain.on('set-size', handleSetSize);
  createWindow();

  app.on('window-all-closed', () => {
    //Add ! to fix mac
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('browser-window-focus', function () {
  globalShortcut.register("CommandOrControl+=", () => {
      //Disable decrase size
  });
  globalShortcut.register("CommandOrControl+-", () => {
    //Disable increase size
});
});

app.on('browser-window-blur', function () {
  globalShortcut.unregister('CommandOrControl+=');
  globalShortcut.unregister('CommandOrControl+-');
});
