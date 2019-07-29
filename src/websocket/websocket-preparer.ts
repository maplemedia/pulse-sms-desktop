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

import { BrowserView } from "electron";
import * as storage from "electron-json-storage";
import * as HttpsProxyAgent from "https-proxy-agent";

export default class WebsocketPreparer {

  private debug = false;
  private proxyAgent = null;

  public prepare = (browser: BrowserView) => {
    browser.webContents.executeJavaScript('localStorage.getItem("account_id")', true)
      .then((id: string): void => {
        id = id.replace(/\"/g, "");
        storage.set("account_id", id);
        this.log("saved account id: " + id);
      });

    browser.webContents.executeJavaScript('localStorage.getItem("hash")', true)
      .then((hash: string): void => {
        hash = hash.replace(/\"/g, "");
        storage.set("hash", hash);
        this.log("saved hash: " + hash);
      });

    browser.webContents.executeJavaScript('localStorage.getItem("salt")', true)
      .then((salt: string): void => {
        salt = salt.replace(/\"/g, "");
        storage.set("salt", salt);
        this.log("saved salt: " + salt);
      });
  }

  public getProxyAgent = (): any => {
    // use the PULSE_PROXY or HTTPS_PROXY environment variable to determine if we should use a proxy
    const envProxy = process.env.PULSE_PROXY || process.env.HTTPS_PROXY;
    if (!this.proxyAgent && envProxy) {
      // console.log("Attempting to get a proxy agent with \"" + envProxy + "\"");
      this.proxyAgent = HttpsProxyAgent(envProxy);
    }

    return this.proxyAgent;
  }

  private log = (message: string): void => {
    if (this.debug) {
      // console.log(message);
    }
  }

}
