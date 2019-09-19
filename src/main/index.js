'use strict'

import {
  app,
  BrowserWindow,
  Menu
} from 'electron'

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
  `http://localhost:8088` :
  `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    maxHeight: 565,
    minHeight: 300,
    useContentSize: true,
    minWidth: 400,
    maxWidth: 400
  })

  mainWindow.loadURL(winURL)

  // 隐藏菜单栏
  Menu.setApplicationMenu(null)

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
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
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}