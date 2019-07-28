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

import { app, BrowserView, BrowserWindow } from "electron";
import * as windowStateKeeper from "electron-window-state";
import * as path from "path";

import DesktopPreferences from "./../preferences";
import BrowserviewPreparer from "./browserview-preparer";

// Add a command line arg to see if the user wants to hide the gui on first launch
let noGui = process.argv.indexOf("--no-gui") > -1;

export default class WindowProvider {

  private browserviewPreparer = new BrowserviewPreparer();
  private preferences = new DesktopPreferences();

  private mainWindow = null;
  private replyWindow = null;
  private browserView = null;

  public createMainWindow = () => {
    let mainWindowState = null;
    let mainWindow = null;
    let bounds = null;

    try {
      mainWindowState = windowStateKeeper( { defaultWidth: 1000, defaultHeight: 750 } );
      bounds = {
        height: mainWindowState.height,
        icon: path.join(__dirname, "../build/icon.png"),
        minHeight: 300,
        minWidth: 300,
        show: !noGui,
        title: "Pulse SMS",
        width: mainWindowState.width,
        x: mainWindowState.x,
        y: mainWindowState.y,
      };
    } catch (err) {
      bounds = {
        height: 750,
        icon: path.join(__dirname, "../build/icon.png"),
        minHeight: 300,
        minWidth: 300,
        show: !noGui,
        title: "Pulse SMS",
        width: 1000,
        x: 0,
        y: 0,
      };
    }

    mainWindow = new BrowserWindow(bounds);

    // always re-enable showing the GUI after first launch
    if (noGui) {
      noGui = false;
    }

    if (app.getLocale().indexOf("en") >= 0 && this.preferences.useSpellcheck()) {
      this.browserView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          preload: path.join(__dirname, "../spellcheck/spellcheck-preparer.js"),
        },
      });
    } else {
      this.browserView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
        },
      });
    }

    mainWindow.setBrowserView(this.browserView);
    this.browserviewPreparer.prepare(mainWindow, this.browserView);

    mainWindow.on("close", (event) => {
      event.preventDefault();
      this.getWindow().hide();

      if (process.platform === "darwin" && this.preferences.minimizeToTray()) {
        app.dock.hide();
      }
    });

    mainWindow.on("closed", (event) => {
      event.preventDefault();
    });

    this.setWindow(mainWindow);
    mainWindowState.manage(mainWindow);

    return mainWindow;
  }

  public createReplyWindow = () => {
    const window = new BrowserWindow({
      height: 550,
      icon: path.join(__dirname, "../build/icon.png"),
      minHeight: 300,
      minWidth: 300,
      title: "Pulse SMS Popup",
      width: 410,
      x: 0,
      y: 0,
    });

    let browserView;
    if (app.getLocale().indexOf("en") >= 0 && this.preferences.useSpellcheck()) {
      browserView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          preload: path.join(__dirname, "../spellcheck/spellcheck-preparer.js"),
        },
      });
    } else {
      browserView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
        },
      });
    }

    window.setBrowserView(browserView);
    this.browserviewPreparer.prepare(window, browserView);

    window.on("close", (event) => {
      this.setReplyWindow(null);
    });

    this.setReplyWindow(window);
  }

  public setWindow = (w) => {
    this.mainWindow = w;
  }

  public getWindow = () => {
    return this.mainWindow;
  }

  public getBrowserView = () => {
    return this.browserView;
  }

  public setReplyWindow = (w) => {
    this.replyWindow = w;
  }

  public getReplyWindow = () => {
    return this.replyWindow;
  }

}
