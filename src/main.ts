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

import { app, BrowserWindow, crashReporter, dialog, MessageBoxReturnValue, Tray } from "electron";
import { autoUpdater } from "electron-updater";

import PulseMenu from "./menu";
import DesktopPreferences from "./preferences";
import PulseWebSocket from "./websocket/websocket";
import WindowProvider from "./window/window-provider";

let windowProvider: WindowProvider = null;
let menu: PulseMenu = null;
let webSocket: PulseWebSocket = null;
let preferences: DesktopPreferences = null;

let mainWindow: BrowserWindow = null;
let tray: Tray = null;

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.exit(0);
}

app.on("second-instance", (): void => {
  if (windowProvider == null || windowProvider.getWindow() == null) {
    initialize();
  }

  windowProvider.getWindow().show();
});

app.setAppUserModelId("xyz.klinker.messenger");
app.on("ready", createWindow);
app.on("activate", createWindow);

app.on("window-all-closed", () => {
  // used to close the app and the web socket here for non-macOS devices
  // We don't want to do that anymore, since we are able to save and restore
  // the app state.
});

app.on("before-quit", () => {
  if (webSocket != null) {
    webSocket.closeWebSocket();
  }

  app.exit(0);
});

try {
  crashReporter.start({
    companyName: "messenger-desktop",
    productName: "messenger",
    // tslint:disable-next-line:max-line-length
    submitURL: "https://messenger-desktop.sp.backtrace.io:6098/post?format=minidump&token=6b041aff41e611b0cbd7c098dba17a179459092c02601691d7261944d0f5705e",
    uploadToServer: true,
  });
} catch (err) {
  // no-op
}

autoUpdater.on("update-downloaded", (): void => {
  const dialogOpts = {
    buttons: ["Install", "Later"],
    detail: "Hit install, then re-open the app, to automatically apply the update.",
    message: "A new version has been downloaded.",
    title: "Pulse Update",
    type: "info",
  };

  try {
    dialog.showMessageBox(null, dialogOpts)
      .then((value: MessageBoxReturnValue) => {
        if (value.response === 0) {
          webSocket.closeWebSocket();
          autoUpdater.quitAndInstall();

          app.exit(0);
        }
      });
  } catch (err) {
    // no-op
  }
});

autoUpdater.on("error", (): void => {
  // no-op
});

function createWindow(): void {
  initialize();

  if (windowProvider.getWindow() === null) {
    mainWindow = windowProvider.createMainWindow();
    tray = menu.buildTray(windowProvider, webSocket);
    menu.buildMenu(windowProvider, tray, webSocket);

    openWebSocket();
  } else {
    if (process.platform === "darwin") {
      app.dock.show();
    }

    windowProvider.getWindow().show();
    webSocket.setWindowProvider(windowProvider);
    menu.buildMenu(windowProvider, tray, webSocket);
  }

  autoUpdater.checkForUpdates();

  if (process.platform === "win32") {
    app.setLoginItemSettings({
      args: [ "--no-gui" ],
      openAtLogin: preferences.openAtLogin(),
    });
  }
}

function initialize(): void {
  if (webSocket == null) {
    webSocket = new PulseWebSocket();
  }

  if (menu == null) {
    menu = new PulseMenu();
  }

  if (windowProvider == null) {
    windowProvider = new WindowProvider();
  }

  if (preferences == null) {
    preferences = new DesktopPreferences();
  }
}

function openWebSocket(): void {
  if (webSocket.isWebSocketRunning()) {
    return;
  }

  webSocket.openWebSocket(windowProvider, tray);
}
