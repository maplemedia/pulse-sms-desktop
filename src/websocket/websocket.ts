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

import { app, Tray } from "electron";
import * as storage from "electron-json-storage";
import * as https from "https";
import * as path from "path";
import * as url from "url";
import * as WebSocket from "ws";
import Notifier from "./../notifier";
import DesktopPreferences from "./../preferences";
import WindowProvider from "./../window/window-provider";
import WebsocketPreparer from "./websocket-preparer";

export default class PulseWebSocket {

  private preferences = new DesktopPreferences();
  private notifier = new Notifier();
  private preparer = new WebsocketPreparer();
  private decrypt = require("../decrypt.js");

  private windowProvider = null;
  private tray = null;
  private socket = null;
  private isRunning = false;
  private lastPing = new Date().getTime();
  private lastOpenedConnection = new Date().getTime();
  private currentTimeout = null;

  public openWebSocket = (provider?: WindowProvider, trayMenu?: Tray) => {
    if (provider) {
      this.setWindowProvider(provider);
    }

    if (trayMenu) {
      this.tray = trayMenu;
    }

    storage.get("account_id", (error, id) => {
      if (error || id == null || id.length === 0) {
        this.scheduleRunCheck();
      } else {
        this.open(id);
      }
    });
  }

  public closeWebSocket = () => {
    try {
      this.socket.terminate();
    } catch (err) {
      // no-op
    }
  }

  public isWebSocketRunning = () => {
    return this.isRunning;
  }

  public setWindowProvider = (provider) => {
    this.windowProvider = provider;
  }

  private open = (accountId) => {
    this.closeWebSocket();

    const wsUrl = "wss://api.messenger.klinkerapps.com/api/v1/stream?account_id=" + accountId;
    this.socket = new WebSocket(wsUrl, { agent: this.preparer.getProxyAgent() });

    this.socket.on("error", (err) =>  {
      // console.log("ws error: " + err);
    });

    this.socket.on("open", () =>  {
      // console.log("websocket: opened connection");
      this.lastOpenedConnection = new Date().getTime();
      this.isRunning = true;

      this.socket.send(JSON.stringify({
        command: "subscribe",
        identifier: "{\"channel\":\"NotificationsChannel\"}",
      }));
    });

    this.socket.on("close", () => {
      // console.log("websocket: closed connection");
      if (new Date().getTime() - this.lastOpenedConnection < 2000) {
        // console.log("websocket: invalid account id request");
        this.scheduleRunCheck(5 * 60 * 1000);
      }
    });

    this.socket.on("message", (event) => {
      const json = JSON.parse(event);
      if (typeof json.type === "undefined") {
        if (typeof json.message !== "undefined" && json.message.operation === "added_message") {
          this.newMessage(json.message.content);
          this.updateBadgeCount(1000);
        } else if (typeof json.message !== "undefined" &&
          (json.message.operation === "read_conversation" || json.message.operation === "removed_conversation")) {
          this.updateBadgeCount();
        }
      }

      this.lastPing = new Date().getTime();
    });

    this.scheduleRunCheck();
    this.updateBadgeCount();
  }

  private checkRunning = () => {
    if (new Date().getTime() - this.lastPing > 1000 * 70) {
      // console.log("restarting the connection");
      this.isRunning = false;

      if (this.windowProvider.getBrowserView()) {
        this.preparer.prepare(this.windowProvider.getBrowserView());
      }

      this.openWebSocket(this.windowProvider);
    }

    this.scheduleRunCheck();
  }

  private scheduleRunCheck = (time?: number) => {
    if (this.currentTimeout != null) {
      clearTimeout(this.currentTimeout);
    }

    if (!time) {
      time = 60 * 1000;
    }

    this.currentTimeout = setTimeout(this.checkRunning, time);
  }

  private newMessage = (message) => {
    storage.getMany(["account_id", "hash", "salt"], (error, result) => {
      if (typeof result === "undefined" || result == null) {
        return;
      }

      let aesKey = null;

      try {
        aesKey = this.decrypt.buildAesKey(result.account_id, result.hash, result.salt);
      } catch (err) {
        return;
      }

      try {
        message.data = this.decrypt.decrypt(message.data, aesKey);
      } catch (err) {
        message.data = "";
      }
      try {
        message.mime_type = this.decrypt.decrypt(message.mime_type, aesKey);
      } catch (err) {
        // no-op
      }
      try {
        message.message_from = this.decrypt.decrypt(message.from, aesKey);
      } catch (err) {
        // no-op
      }

      if (message.type === 0) {
        // console.log("providing notification");

        const conversationUrl = "https://api.messenger.klinkerapps.com/api/v1/conversations/" +
          message.conversation_id + "?account_id=" + result.account_id;
        this.getJSON(conversationUrl, (conversation) => {
          if (typeof conversation !== "undefined" && conversation != null) {
            try {
              this.provideNotification(message, conversation, aesKey);
            } catch (err) {
              // no-op
            }
          }
        });
      }
    });
  }

  private updateBadgeCount = (timeout?: number) => {
    if (!this.preferences.badgeDockIcon()) {
      return;
    }

    if (!timeout) {
      timeout = 0;
    }

    setTimeout(() => {
      storage.get("account_id", (error, id) => {
        if (!error && id.length !== 0) {
          const urlToGet = "https://api.messenger.klinkerapps.com/api/v1/conversations/unread_count?account_id=" + id;
          this.getJSON(urlToGet, (unread) => {
            if (typeof unread !== "undefined" && unread != null) {
              try {
                if (process.platform === "win32" && this.tray != null) {
                  this.setWindowsIndicator(unread, this.tray);
                } else {
                  this.setMacLinuxIndicators(unread, this.tray);
                }
              } catch (err) {
                // console.log(err);
              }
            }
          });
        }
      });
    }, timeout);
  }

private setWindowsIndicator = (unread, tray) => {
    const window = this.windowProvider.getWindow();
    if (unread.unread > 0) {
      tray.setImage(path.resolve(__dirname, "../assets/tray/windows-unread.ico"));
      if (typeof window !== "undefined" && window != null) {
        window.setOverlayIcon(
          path.resolve(__dirname, "../assets/windows-overlay.ico"),
          unread.unread + " Unread Conversations",
        );
      }
    } else {
      tray.setImage(path.resolve(__dirname, "../assets/tray/windows.ico"));
      if (typeof window !== "undefined" && window != null) {
        window.setOverlayIcon(null, "No Unread Conversations");
      }
    }
  }

private setMacLinuxIndicators = (unread, tray) => {
    app.setBadgeCount(unread.unread);
    if (process.platform === "darwin" && tray != null) {
      tray.setTitle(unread.unread === 0 ? "" : unread.unread + "");
    }
  }

private provideNotification = (message, conversation, aesKey) => {
    if (conversation == null) {
      return;
    }

    let title = this.decrypt.decrypt(conversation.title, aesKey);
    const phoneNumbers = this.decrypt.decrypt(conversation.phone_numbers, aesKey);
    let snippet = message.mime_type === "text/plain" ? message.data : "New Message";

    if (snippet === "") {
      this.closeWebSocket();
      return;
    }

    if (phoneNumbers.indexOf(",") > 0 && message.message_from.length > 0) {
      snippet = message.message_from + ": " + snippet;
    }

    if (conversation.private_notifications) {
      title = "New Message";
      snippet = "";
    }

    if (!conversation.mute) {
      this.notifier.notify(
        title,
        snippet,
        message.conversation_id,
        conversation.private_notifications,
        this.windowProvider,
      );
    }
  }

private getJSON = (urlToGet, successHandler) => {
    const options: any = url.parse(urlToGet);
    options.agent = this.preparer.getProxyAgent();
    const req = https.get(options, (response) => {
      let body = "";
      response.on("data", (d) => {
        body += d;
      });
      response.on("end", () => {
        try {
          successHandler(JSON.parse(body));
        } catch (err) {
          // no-op
        }
      });
      response.on("error", () => {
        // no-op
      });
    });

    req.on("error", (error) => {
      // no-op
    });
  }

}
