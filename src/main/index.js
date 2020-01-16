'use strict'

import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  globalShortcut
} from 'electron'

const path = require('path');

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
  `http://localhost:8088` :
  `file://${__dirname}/index.html`

let appTray;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    maxHeight: 565,
    minHeight: 360,
    useContentSize: true,
    minWidth: 400,
    maxWidth: 400,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(winURL)

  // 隐藏菜单栏
  Menu.setApplicationMenu(null)
  mainWindow.setMenu(null);

  // 窗口关闭的监听  
  mainWindow.on('closed', () => mainWindow = null);
  // mainWindow.webContents.openDevTools()

  //系统托盘
  const trayMenutemplate = [{
    label: '退出',
    click: () => mainWindow.destroy()
  }];
  const trayIcon = path.join(__dirname, 'icons');
  appTray = new Tray(path.join(trayIcon, 'icon.ico'));
  const contextMenu = Menu.buildFromTemplate(trayMenutemplate);
  appTray.setToolTip('richness');
  appTray.setContextMenu(contextMenu);
  const setWindowStatus = () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    mainWindow.isVisible() ? mainWindow.setSkipTaskbar(false) : mainWindow.setSkipTaskbar(true);
  }
  appTray.on('click', () => {
    setWindowStatus();
  });

  ipcMain.on('setToolTip', (e, arg) => {
    appTray.setToolTip(arg);
  });

  mainWindow.on('close', e => {
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
    e.preventDefault();
  });

  mainWindow.on('show', () => appTray.setHighlightMode('always'));

  mainWindow.on('hide', () => appTray.setHighlightMode('never'));

  //快捷键
  globalShortcut.register('Alt+Q', () => {
    setWindowStatus();
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  globalShortcut.unregister('Alt+Q')
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.on('ready', createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      globalShortcut.unregister('Alt+Q')
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}