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

import SpellcheckProvider from "../spellcheck/spellcheck-provider";

export default class BrowserviewPreparer {

  private spellCheck = new SpellcheckProvider();
  private websocketPreparer = require("../websocket/websocket-preparer.js");
  private preferences = require("../preferences.js");

  public prepare = (window, browser) => {
    browser.setBounds({
      height: window.getBounds().height - this.getTitleBarSize(window),
      width: window.getBounds().width,
      x: 0,
      y: 0,
    });
    browser.setAutoResize( { width: true, height: true } );
    browser.webContents.loadURL("https://pulsesms.app");

    browser.webContents.on("dom-ready", (event) => {
      this.websocketPreparer.prepare(browser);
    });

    browser.webContents.on("did-fail-load", (event) => {
      setTimeout(() => {
        browser.webContents.loadURL("https://pulsesms.app");
      }, 2000);
    });

    browser.webContents.on("new-window", (event, url) => {
      try {
        require("electron").shell.openExternal(url);
        event.preventDefault();
      } catch (error) {
        // console.log("Ignoring " + url + " due to " + error.message);
      }
    });

    this.spellCheck.prepareMenu(window, browser);
  }

  private getTitleBarSize = (window) => {
    if (process.platform === "darwin") {
      return 20;
    } else if (process.platform === "win32") {
      return this.preferences.autoHideMenuBar() ? 40 : 60;
    } else {
      return 0;
    }
  }
}
