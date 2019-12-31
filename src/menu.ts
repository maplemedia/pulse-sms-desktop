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

import { app, dialog, globalShortcut, Menu, MessageBoxReturnValue, Tray } from "electron";
import * as path from "path";

import DesktopPreferences from "./preferences";
import PulseWebSocket from "./websocket/websocket";
import BrowserViewPreparer from "./window/browserview-preparer";
import WindowProvider from "./window/window-provider";

export default class PulseMenu {

  private browserviewPreparer = new BrowserViewPreparer();
  private preferences = new DesktopPreferences();

  private notificationPreferencesMenu: any = {
    label: "Notification Preferences",
    submenu: [{
        checked: this.preferences.showNotifications(),
        click: (): void => {
          this.preferences.toggleShowNotifications();
        },
        label: "Show Notifications",
        type: "checkbox",
      }, {
        checked: this.preferences.notificationSounds(),
        click: (): void => {
          this.preferences.toggleNotificationSounds();
        },
        label: "Play Notification Sound",
        type: "checkbox",
      }, { type: "separator" }, {
        checked: this.preferences.notificationSenderPreviews(),
        click: (): void => {
          this.preferences.toggleNotificationSenderPreviews();
        },
        label: "Display Sender in Notification",
        type: "checkbox",
      }, {
        checked: this.preferences.notificationMessagePreviews(),
        click: (): void => {
          this.preferences.toggleNotificationMessagePreviews();
        },
        label: "Display Message Preview in Notification",
        type: "checkbox",
      }, { type: "separator" }, {
        label: "Snooze Desktop Notifications",
        submenu: [{
            checked: this.preferences.isSnoozeActive() && this.preferences.currentSnoozeSelection() === "30_mins",
            click: (): void => {
              this.preferences.snooze("30_mins");
            },
            label: "30 mins",
            type: "checkbox",
          }, {
            checked: this.preferences.isSnoozeActive() && this.preferences.currentSnoozeSelection() === "1_hour",
            click: (): void => {
              this.preferences.snooze("1_hour");
            },
            label: "1 hour",
            type: "checkbox",
          }, {
            checked: this.preferences.isSnoozeActive() && this.preferences.currentSnoozeSelection() === "3_hours",
            click: (): void => {
              this.preferences.snooze("3_hours");
            },
            label: "3 hours",
            type: "checkbox",
          }, {
            checked: this.preferences.isSnoozeActive() && this.preferences.currentSnoozeSelection() === "12_hours",
            click: (): void => {
              this.preferences.snooze("12_hours");
            },
            label: "12 hours",
            type: "checkbox",
          },
        ],
      },
    ],
  };

  public buildMenu = (windowProvider: WindowProvider, tray: Tray, webSocket: PulseWebSocket): void => {
    const template: any[] = [{
      label: "Preferences",
      submenu: [ this.notificationPreferencesMenu, { type: "separator" }, {
        checked: this.preferences.minimizeToTray(),
        click: (): void => {
          const toTray = !this.preferences.minimizeToTray();
          this.preferences.toggleMinimizeToTray();

          if (!toTray && tray != null) {
            tray.destroy();
          } else {
            tray = this.buildTray(windowProvider, webSocket);
          }
        },
        label: process.platform === "darwin" ? "Show in Menu Bar" : "Show in Tray",
        type: "checkbox",
      } ],
    }, {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteandmatchstyle" },
        { role: "delete" },
        { role: "selectall" },
      ],
    }, {
      label: "View",
      submenu: [{
        accelerator: "CmdOrCtrl+R",
        click: (): void => {
          windowProvider.getBrowserView().webContents.loadURL("https://pulsesms.app");
        },
        label: "Reload",
      }, {
        accelerator: "CmdOrCtrl+I",
        click: (): void => {
          windowProvider.getBrowserView().webContents.toggleDevTools();
        },
        label: "Toggle Developer Tools",
      },
      { type: "separator" },
      { role: "resetzoom" },
      { role: "zoomin" },
      { role: "zoomout" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
    }, {
      role: "window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
      ],
    }, {
      role: "help",
      submenu: [ {
          click: (): void => {
            require("electron").shell.openExternal("https://github.com/klinker-apps/pulse-desktop/releases");
          },
          label: require("electron").app.getVersion(),
        }, {
          click: (): void => {
            require("electron").shell.openExternal("https://messenger.klinkerapps.com/help");
          },
          label: "Get Help",
        }, {
          click: (): void => {
            require("electron").shell.openExternal("https://messenger.klinkerapps.com/overview");
          },
          label: "Platform Support",
        }, {
          click: (): void => {
            // tslint:disable-next-line:max-line-length
            require("electron").shell.openExternal("https://play.google.com/store/apps/details?id=xyz.klinker.messenger");
          },
          label: "Get it on Google Play",
        },

      ],
    }];

    template[0].submenu.push({
      checked: this.preferences.badgeDockIcon(),
      click: (): void => {
        const badge = !this.preferences.badgeDockIcon();
        this.preferences.toggleBadgeDockIcon();

        if (!badge) {
          if (process.platform !== "win32") {
            require("electron").app.badgeCount = 0;
          }

          if (process.platform === "darwin" && tray != null) {
            tray.setTitle("");
          }

          if (process.platform === "win32") {
            windowProvider.getWindow().setOverlayIcon(null, "No Unread Conversations");
            if (tray != null) {
              tray.setImage(path.resolve(__dirname, "assets/tray/windows.ico"));
            }
          }
        }
      },
      label: process.platform !== "win32" ? "Show Unread Count on Icon" : "Show Unread Indicator on Icon",
      type: "checkbox",
    });

    if (app.getLocale().indexOf("en") > -1) {
      template[0].submenu.push({
        checked: this.preferences.useSpellcheck(),
        click: (): void => {
          this.preferences.toggleUseSpellcheck();

          const dialogOpts = {
            buttons: ["Restart", "Later"],
            detail: 'Hit \"Restart\", then re-open the app, to apply the preference.',
            message: "This preference will not be applied until the app is restarted.",
            title: "App Restart Required",
            type: "info",
          };

          dialog.showMessageBox(null, dialogOpts)
            .then((value: MessageBoxReturnValue) => {
              if (value.response === 0) {
                webSocket.closeWebSocket();
                app.exit(0);
              }
            }).catch(() => {
              // no-op
            });
        },
        label: "Use Spellcheck",
        type: "checkbox",
      });
    }

    if (process.platform === "win32") {
      template[0].submenu.push({
        checked: this.preferences.openAtLogin(),
        click: (): void => {
          const autoOpen = !this.preferences.openAtLogin();
          this.preferences.toggleOpenAtLogin();
          if (autoOpen) {
            app.setLoginItemSettings({
              args: [ "--no-gui" ],
              openAtLogin: autoOpen,
            });
          } else {
            app.setLoginItemSettings({ openAtLogin: false });
          }
        },
        label: "Auto-Open at Login",
        type: "checkbox",
      });
    }

    if (process.platform === "darwin") {
      const name = require("electron").app.name;
      template.unshift({
        label: name,
        submenu: [
          { type: "separator" },
          { label: "Hide Pulse", role: "hide" },
          { role: "hideothers" },
          { role: "unhide" },
          { type: "separator" },
          { label: "Quit Pulse", role: "quit" },
        ],
      });

      // Edit menu
      template[2].submenu.push(
        { type: "separator" },
        { label: "Speech", submenu: [
          { role: "startspeaking" },
          { role: "stopspeaking" },
        ]},
      );

      // Windows menu
      template[4].submenu = [
        { accelerator: "CmdOrCtrl+W", label: "Close", role: "close" },
        { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "Zoom", role: "zoom" },
        { type: "separator" },
        { label: "Bring All to Front", role: "front" },
      ];
    } else {
      // Windows menu
      template[3].submenu.push({ type: "separator" });
      template[3].submenu.push({
        accelerator: "Alt+M",
        click: (): void => {
          const win = windowProvider.getWindow();
          const menuVisible = win.isMenuBarVisible();

          win.autoHideMenuBar = menuVisible;
          win.setMenuBarVisibility(!menuVisible);

          this.preferences.toggleHideMenuBar();
          this.browserviewPreparer.setBounds(win, windowProvider.getBrowserView());

          if (menuVisible && !this.preferences.seenMenuBarWarning()) {
            const dialogOpts = {
              buttons: ["OK"],
              message: "Tapping Alt+M will allow you to toggle whether or not the menu bar is displayed.",
              title: "Showing the Menu Bar",
              type: "info",
            };

            dialog.showMessageBox(null, dialogOpts);
            this.preferences.toggleSeenMenuBarWarning();
          }
        },
        label: "Toggle Menu Bar Visibility",
      });
    }

    const window = windowProvider.getWindow();
    const hideMenuBar = this.preferences.hideMenuBar();
    const menu = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(menu);

    window.autoHideMenuBar = hideMenuBar;
    window.setMenuBarVisibility(!hideMenuBar);

    this.browserviewPreparer.setBounds(window, windowProvider.getBrowserView());
  }

  public buildTray = (windowProvider: WindowProvider, webSocket: PulseWebSocket) => {
    if (!this.preferences.minimizeToTray()) {
      return;
    }

    let iconName = null;
    if (process.platform === "darwin") {
      iconName = "macTemplate.png";
    } else if (process.platform === "win32") {
      iconName = "windows.ico";
    } else {
      iconName = "linux.png";
    }

    const tray = new Tray(path.resolve(__dirname, "assets/tray/" + iconName));
    if (process.platform === "darwin") {
      tray.setPressedImage(path.resolve(__dirname, "assets/tray/macHighlight.png"));
    }

    const contextMenu = Menu.buildFromTemplate([{
      click: (): void => {
        this.showWindow(windowProvider);
      },
      label: "Show Pulse",
    }, {
      click: (): void => {
        this.showPopupWindow(windowProvider);
      },
      label: "Show Popup Window",
    }, this.notificationPreferencesMenu, {
      accelerator: "Command+Q",
      click: (): void => {
        webSocket.closeWebSocket();
        app.exit(0);
      },
      label: "Quit",
    }]);
    tray.setToolTip("Pulse SMS");
    tray.setContextMenu(contextMenu);

    tray.on("click", (): void => {
      this.showWindow(windowProvider);
    });

    return tray;
  }

  private showWindow = (windowProvider: WindowProvider): void => {
    if (windowProvider.getWindow() != null) {
      windowProvider.getWindow().show();
      if (process.platform === "darwin") {
        app.dock.show();
      }
    } else {
      windowProvider.createMainWindow();
    }
  }

  private showPopupWindow = (windowProvider: WindowProvider): void => {
    if (windowProvider.getReplyWindow() !== null) {
      windowProvider.getReplyWindow().show();
      windowProvider.getReplyWindow().focus();
    } else {
      windowProvider.createReplyWindow();
    }
  }

}
