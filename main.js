/*
 *  Copyright 2018 Luke Klinker
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const { app, Tray, Menu, dialog, crashReporter } = require('electron')
const { autoUpdater } = require("electron-updater")

let windowProvider = null
let webSocket = null
let menu = null
let preferences = null

let mainWindow = null
let tray = null

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.exit(0)
  return;
}

app.on('second-instance', () => {
  if (windowProvider == null || windowProvider.getWindow() == null) {
    initialize()
  }

  windowProvider.getWindow().show()
})

app.setAppUserModelId("xyz.klinker.messenger")
app.on('ready', createWindow)
app.on('activate', createWindow)

app.on('window-all-closed', () => {
  // used to close the app and the web socket here for non-macOS devices
  // We don't want to do that anymore, since we are able to save and restore
  // the app state.
})

app.on('before-quit', () => {
  if (webSocket != null) {
    webSocket.closeWebSocket()
  }

  app.exit(0)
})

try {
  crashReporter.start({
    productName: "messenger",
    companyName: "messenger-desktop",
    submitURL: "https://messenger-desktop.sp.backtrace.io:6098/post?format=minidump&token=6b041aff41e611b0cbd7c098dba17a179459092c02601691d7261944d0f5705e",
    uploadToServer: true
  })
} catch (err) { }

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Install', 'Later'],
    title: 'Pulse Update',
    message: 'A new version has been downloaded.',
    detail: 'Hit install, then re-open the app, to automatically apply the update.'
  }

  try {
    dialog.showMessageBox(dialogOpts, (response) => {
      if (response === 0) {
        webSocket.closeWebSocket()
        autoUpdater.quitAndInstall()
        
        app.exit(0)
      }
    })
  } catch (err) { }
})

autoUpdater.on('error', message => {
  console.error('There was a problem updating the app.')
  console.error(message)
})

function createWindow() {
  initialize()

  if (windowProvider.getWindow() === null) {
    mainWindow = windowProvider.createMainWindow()
    tray = menu.buildTray(windowProvider, webSocket)
    menu.buildMenu(windowProvider, tray, webSocket)

    openWebSocket()
  } else {
    if (process.platform === 'darwin') {
      app.dock.show()
    }

    windowProvider.getWindow().show()
    webSocket.setWindowProvider(windowProvider)
    menu.buildMenu(windowProvider, tray, webSocket)
  }

  autoUpdater.checkForUpdates();
  if (process.platform === 'win32') {
    app.setLoginItemSettings({ openAtLogin: preferences.openAtLogin() })
  }
}

function initialize() {
  if (menu == null) {
    menu = require('./src/menu.js')
  }

  if (webSocket == null) {
    webSocket = require('./src/websocket/websocket.js')
  }

  if (windowProvider == null) {
    windowProvider = require('./src/window/window-provider.js')
  }

  if (preferences == null) {
    preferences = require('./src/preferences.js')
  }
}

function openWebSocket() {
  if (webSocket.isWebSocketRunning()) {
    return
  }

  webSocket.openWebSocket(windowProvider, tray)
}
