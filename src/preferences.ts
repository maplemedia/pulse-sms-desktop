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

import * as settings from "electron-settings";

export default class DesktopPreferences {

  // Snooze Preferences
  private static SNOOZE_END_TIME = "snooze-end-time";
  private static SNOOZE_PREFERENCE = "snooze-selected-preference";

  // Boolean Preference: Default to FALSE
  private static AUTO_HIDE_MENU_BAR = "auto-hide-menu-bar";

  // Boolean Preference: Default to TRUE
  private static SHOW_NOTIFICATIONS = "show-notifications";
  private static NOTIFICATION_SOUNDS = "notification-sounds";
  private static NOTIFICATION_SENDER_PREVIEWS = "notification-sender-previews";
  private static NOTIFICATION_MESSAGE_PREVIEWS = "notification-message-previews";
  private static BADGE_DOCK_ICON = "badge-dock-icon";
  private static USE_SPELLCHECK = "use-spellcheck";
  private static OPEN_AT_LOGIN = "open-at-login";
  private static MINIMIZE_TO_TRAY = "minimize-to-tray";

  public isSnoozeActive = () => {
    const hasValue = settings.has(DesktopPreferences.SNOOZE_END_TIME)
      && settings.has(DesktopPreferences.SNOOZE_PREFERENCE)
      && settings.get(DesktopPreferences.SNOOZE_PREFERENCE) !== "none";

    if (!hasValue) {
      return false;
    }

    const snoozeEndTime = +settings.get(DesktopPreferences.SNOOZE_END_TIME);
    const currentTime = new Date().getTime();
    return currentTime < snoozeEndTime;
  }

  public currentSnoozeSelection = () => {
    return settings.has(DesktopPreferences.SNOOZE_PREFERENCE) ?
      settings.get(DesktopPreferences.SNOOZE_PREFERENCE) : "none";
  }

  public snooze = (identifier) => {
    if (this.currentSnoozeSelection() === identifier) {
      settings.set(DesktopPreferences.SNOOZE_PREFERENCE, "none");
      settings.set(DesktopPreferences.SNOOZE_END_TIME, "0");
      return;
    }

    settings.set(DesktopPreferences.SNOOZE_PREFERENCE, identifier);

    if (identifier === "30_mins") {
      settings.set(DesktopPreferences.SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 30) + "");
    } else if (identifier === "1_hour") {
      settings.set(DesktopPreferences.SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60) + "");
    } else if (identifier === "3_hours") {
      settings.set(DesktopPreferences.SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60 * 3) + "");
    } else if (identifier === "12_hours") {
      settings.set(DesktopPreferences.SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60 * 12) + "");
    }
  }

  public autoHideMenuBar = () => (
    settings.has(DesktopPreferences.AUTO_HIDE_MENU_BAR) &&
      settings.get(DesktopPreferences.AUTO_HIDE_MENU_BAR) === "true"
  )

  public showNotifications = () => (
    !settings.has(DesktopPreferences.SHOW_NOTIFICATIONS) ||
      settings.get(DesktopPreferences.SHOW_NOTIFICATIONS) === "true"
  )

  public notificationSounds = () => (
    !settings.has(DesktopPreferences.NOTIFICATION_SOUNDS) ||
      settings.get(DesktopPreferences.NOTIFICATION_SOUNDS) === "true"
  )

  public notificationSenderPreviews = () => (
    !settings.has(DesktopPreferences.NOTIFICATION_SENDER_PREVIEWS) ||
      settings.get(DesktopPreferences.NOTIFICATION_SENDER_PREVIEWS) === "true"
  )

  public notificationMessagePreviews = () => (
    !settings.has(DesktopPreferences.NOTIFICATION_MESSAGE_PREVIEWS) ||
      settings.get(DesktopPreferences.NOTIFICATION_MESSAGE_PREVIEWS) === "true"
  )

  public badgeDockIcon = () => (
    !settings.has(DesktopPreferences.BADGE_DOCK_ICON) ||
      settings.get(DesktopPreferences.BADGE_DOCK_ICON) === "true"
  )

  public useSpellcheck = () => (
    !settings.has(DesktopPreferences.USE_SPELLCHECK) ||
      settings.get(DesktopPreferences.USE_SPELLCHECK) === "true"
  )

  public openAtLogin = () => (
    !settings.has(DesktopPreferences.OPEN_AT_LOGIN) ||
      settings.get(DesktopPreferences.OPEN_AT_LOGIN) === "true"
  )

  public minimizeToTray = () => (
    !settings.has(DesktopPreferences.MINIMIZE_TO_TRAY) ||
      settings.get(DesktopPreferences.MINIMIZE_TO_TRAY) === "true"
  )

  public toggleAutoHideMenuBar = () => {
    this.togglePreference(DesktopPreferences.AUTO_HIDE_MENU_BAR, this.autoHideMenuBar);
  }

  public toggleShowNotifications = () => {
    this.togglePreference(DesktopPreferences.SHOW_NOTIFICATIONS, this.showNotifications);
  }

  public toggleNotificationSounds = () => {
    this.togglePreference(DesktopPreferences.NOTIFICATION_SOUNDS, this.notificationSounds);
  }

  public toggleNotificationSenderPreviews = () => {
    this.togglePreference(DesktopPreferences.NOTIFICATION_SENDER_PREVIEWS, this.notificationSenderPreviews);
  }

  public toggleNotificationMessagePreviews = () => {
    this.togglePreference(DesktopPreferences.NOTIFICATION_MESSAGE_PREVIEWS, this.notificationMessagePreviews);
  }

  public toggleBadgeDockIcon = () => {
    this.togglePreference(DesktopPreferences.BADGE_DOCK_ICON, this.badgeDockIcon);
  }

  public toggleUseSpellcheck = () => {
    this.togglePreference(DesktopPreferences.USE_SPELLCHECK, this.useSpellcheck);
  }

  public toggleOpenAtLogin = () => {
    this.togglePreference(DesktopPreferences.OPEN_AT_LOGIN, this.openAtLogin);
  }

  public toggleMinimizeToTray = () => {
    this.togglePreference(DesktopPreferences.MINIMIZE_TO_TRAY, this.minimizeToTray);
  }

  private togglePreference = (id, getter) => {
    settings.set(id, !getter() + "");
  }
}
