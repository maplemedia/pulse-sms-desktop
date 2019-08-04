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

import { BrowserView, BrowserWindow } from "electron";
import DesktopPreferences from "./../preferences";
import SpellcheckProvider from "./../spellcheck/spellcheck-provider";
import WebsocketPreparer from "./../websocket/websocket-preparer";

export default class BrowserViewPreparer {

  private spellCheck = new SpellcheckProvider();
  private websocketPreparer = new WebsocketPreparer();
  private preferences = new DesktopPreferences();

  public prepare = (window: BrowserWindow, browser: BrowserView) => {
    this.setBounds(window, browser);
    browser.setAutoResize( { width: true, height: true, horizontal: false, vertical: true } );
    browser.webContents.loadURL("https://pulsesms.app");

    browser.webContents.on("dom-ready", (event: Event): void => {
      this.websocketPreparer.prepare(browser);
    });

    browser.webContents.on("did-fail-load", (event: Event): void => {
      setTimeout(() => {
        browser.webContents.loadURL("https://pulsesms.app");
      }, 2000);
    });

    browser.webContents.on("new-window", (event: Event, url: string): void => {
      try {
        require("electron").shell.openExternal(url);
        event.preventDefault();
      } catch (error) {
        // console.log("Ignoring " + url + " due to " + error.message);
      }
    });

    this.spellCheck.prepareMenu(window, browser);
  }

  public setBounds = (window: BrowserWindow, browser: BrowserView) => {
    browser.setBounds({
      height: window.getBounds().height - this.getTitleBarSize(window),
      width: window.getBounds().width,
      x: 0,
      y: this.getYOffset(window),
    });
  }

  private getYOffset = (window: BrowserWindow): number => {
    if (process.platform === "darwin" || !this.preferences.autoHideMenuBar()) {
      return 0;
    }

    return window.isMenuBarVisible() ? 20 : 0;
  }

  private getTitleBarSize = (window: BrowserWindow): number => {
    if (process.platform === "darwin") {
      return 20;
    } else if (process.platform === "win32") {
      return this.preferences.autoHideMenuBar() && window.isMenuBarVisible() ? 40 : 60;
    } else {
      return this.preferences.autoHideMenuBar() && window.isMenuBarVisible() ? 20 : 0;
    }
  }

}
