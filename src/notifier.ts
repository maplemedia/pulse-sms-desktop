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

import { app, Notification } from "electron";
import * as storage from "electron-json-storage";
import * as https from "https";
import * as path from "path";
import * as encrypt from "./decrypt.js";
import DesktopPreferences from "./preferences";
import WebsocketPreparer from "./websocket/websocket-preparer";

export default class Notifier {

  private preferences = new DesktopPreferences();
  private websocketPreparer = new WebsocketPreparer();

  private lastNotificationTime = new Date().getTime();
  private currentNotification = null;
  private windowProvider = null;

  public notify = (title, snippet, conversationId, isPrivate, provider) => {
    this.windowProvider = provider;

    if (!this.shouldProvideNotification() || title == null ||
      snippet == null || title.length === 0) {
      return;
    }

    if (!this.preferences.notificationSenderPreviews()) {
      title = "New Message";
    }

    if (!this.preferences.notificationMessagePreviews()) {
      snippet = "";
    }

    this.genericNotification(title, snippet, conversationId, isPrivate);
  }

  private genericNotification(title, snippet, conversationId, isPrivate) {
    const options = {
      body: snippet,
      hasReply: !isPrivate,
      replyPlaceholder: "Reply to " + title,
      silent: !this.preferences.notificationSounds(),
      title,
    };

    if (process.platform !== "darwin") {
      (options as any).icon = path.join(__dirname, "assets/notification-icon.png");
    }

    if (this.currentNotification != null) {
      this.currentNotification.close();
    }

    this.currentNotification = new Notification(options);

    this.currentNotification.on("reply", (event, reply) => {
      this.sendMessage(reply, conversationId);
      this.dismissNotification(conversationId);
      this.markAsRead(conversationId);
    });

    this.currentNotification.on("click", (event) => {
      let link = "https://pulsesms.app/thread/" + conversationId;

      if (isPrivate) {
        link = "https://pulsesms.app/passcode";
      }

      if (this.windowProvider.getWindow() !== null) {
        this.windowProvider.getBrowserView().webContents
          .executeJavaScript(`document.getElementById("${conversationId}").click().length`, true)
          .then((length) => {
            if (length === 0) {
              this.windowProvider.getBrowserView().webContents.loadURL(link);
            }
          });

        this.windowProvider.getWindow().show();
        this.windowProvider.getWindow().focus();

        if (process.platform === "darwin") {
          app.dock.show();
        }
      } else {
        this.createWindow(link, conversationId);
      }
    });

    this.currentNotification.show();
  }

  private shouldProvideNotification = (): boolean => {
    if ((new Date().getTime() - this.lastNotificationTime) > 5000) {
      this.lastNotificationTime = new Date().getTime();
      return this.preferences.showNotifications() && !this.preferences.isSnoozeActive();
    } else {
      return false;
    }
  }

  private createWindow = (link, conversationId) => {
    this.windowProvider.createMainWindow();
    setTimeout(() => {
      this.windowProvider.getBrowserView().webContents.loadURL(link);
    }, 1000);
  }

  private createReplyWindow = (link) => {
    if (this.windowProvider.getReplyWindow() !== null) {
      this.windowProvider.getReplyWindow().webContents
        .executeJavaScript(`document.getElementById("messenger").loadURL("${link}")`);
      this.windowProvider.getReplyWindow().show();
      this.windowProvider.getReplyWindow().focus();
    } else {
      this.windowProvider.createReplyWindow();
      setTimeout(() => {
        this.windowProvider.getReplyWindow().webContents
          .executeJavaScript(`document.getElementById("messenger").loadURL("${link}")`);
      }, 500);
    }
  }

  private sendMessage = (text, conversationId) => {
    storage.getMany(["account_id", "hash", "salt"], (error, result) => {
      let aesKey = null;

      try {
        aesKey = encrypt.buildAesKey(result.account_id, result.hash, result.salt);
      } catch (err) {
        return;
      }

      const data = JSON.stringify({
        account_id: result.account_id,
        data: encrypt.encrypt(text, aesKey),
        device_conversation_id: conversationId,
        device_id: this.generateId(),
        message_type: 2,
        mime_type: encrypt.encrypt("text/plain", aesKey),
        read: true,
        seen: true,
        sent_device: 3,
        timestamp: new Date().getTime(),
      });

      const options = {
        agent: this.websocketPreparer.getProxyAgent(),
        headers: {
          "Content-Length": Buffer.byteLength(data),
          "Content-Type": "application/json",
        },
        hostname: "api.messenger.klinkerapps.com",
        method: "POST",
        path: "/api/v1/messages/add",
      };

      const req = https.request(options);

      req.on("error", (e) => {
        // console.log(`problem with request: ${e.message}`);
      });

      req.write(data);
      req.end();
    });
  }

private dismissNotification = (conversationId) => {
    storage.getMany(["account_id"], (error, result) => {
      const data = JSON.stringify({
        account_id: result.account_id,
        id: conversationId,
      });

      const options = {
        agent: this.websocketPreparer.getProxyAgent(),
        headers: {
          "Content-Length": Buffer.byteLength(data),
          "Content-Type": "application/json",
        },
        hostname: "api.messenger.klinkerapps.com",
        method: "POST",
        path: "/api/v1/accounts/dismissed_notification",
      };

      const req = https.request(options);

      req.on("error", (e) => {
        // console.log(`problem with request: ${e.message}`);
      });

      req.write(data);
      req.end();
    });
  }

private markAsRead = (conversationId) => {
    storage.getMany(["account_id"], (error, result) => {
      const data = JSON.stringify({
        account_id: result.account_id,
      });

      const options = {
        agent: this.websocketPreparer.getProxyAgent(),
        headers: {
          "Content-Length": Buffer.byteLength(data),
          "Content-Type": "application/json",
        },
        hostname: "api.messenger.klinkerapps.com",
        method: "POST",
        path: `/api/v1/conversations/read/${conversationId}`,
      };

      const req = https.request(options);

      req.on("error", (e) => {
        // console.log(`problem with request: ${e.message}`);
      });

      req.write(data);
      req.end();
    });
  }

private getRandomInt = (min, max): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

private generateId = (): number => {
    return this.getRandomInt(1, 922337203685477);
  }
}
