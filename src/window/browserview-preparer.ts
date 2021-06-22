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
import RightClickMenuProvider from "../spellcheck/right-click-menu-provider";
import WebsocketPreparer from "./../websocket/websocket-preparer";

export default class BrowserViewPreparer {

  private menuProvider = new RightClickMenuProvider();
  private websocketPreparer = new WebsocketPreparer();

  public prepare = (window: BrowserWindow, browser: BrowserView) => {
    this.setBounds(window, browser);
    browser.setAutoResize( { width: true, height: true, horizontal: false, vertical: true } );
    browser.webContents.loadURL("https://pulsesms.app?iframe_source=desktop");

    browser.webContents.on("dom-ready", (event: Event): void => {
      this.websocketPreparer.prepare(browser);
    });

    browser.webContents.on("did-fail-load", (event: Event): void => {
      setTimeout(() => {
        browser.webContents.loadURL("https://pulsesms.app?iframe_source=desktop");
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

    this.menuProvider.prepareMenu(window, browser);
  }

  public setBounds = (window: BrowserWindow, browser: BrowserView) => {
    const titleBarHeight = this.getTitleBarSize(window);
    const titleBarOffset = this.getTitleBarOffset();
    browser.setBounds({
      height: window.getBounds().height - titleBarHeight,
      width: window.getBounds().width,
      x: 0,
      y: titleBarOffset,
    });
  }

  private getTitleBarSize = (window: BrowserWindow): number => {
    if (process.platform === "darwin") {
      return 20;
    } else if (process.platform === "win32") {
      return window.isMenuBarVisible() ? 60 : 40;
    } else {
      return window.isMenuBarVisible() ? 25 : 0;
    }
  }

  private getTitleBarOffset = (): number => {
    if (process.platform === "darwin") {
      return 0;
    } else if (process.platform === "win32") {
      return 0;
    } else {
      return 0;
    }
  }

}
