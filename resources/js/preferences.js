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

(function() {
  const settings = require('electron-settings')

  // Snooze Preferences
  const SNOOZE_END_TIME = 'snooze-end-time'
  const SNOOZE_PREFERENCE = 'snooze-selected-preference'

  var isSnoozeActive = () => {
    var hasValue = settings.has(SNOOZE_END_TIME) && settings.has(SNOOZE_PREFERENCE) && settings.get(SNOOZE_PREFERENCE) != "none"
    if (!hasValue) {
      return false
    }

    var snoozeEndTime = parseInt(settings.get(SNOOZE_END_TIME))
    var currentTime = new Date().getTime()
    return currentTime < snoozeEndTime
  }

  var currentSnoozeSelection = () => {
    return settings.has(SNOOZE_PREFERENCE) ? settings.get(SNOOZE_PREFERENCE) : "none"
  }

  var snooze = (identifier) => {
    if (currentSnoozeSelection() == identifier) {
      settings.set(SNOOZE_PREFERENCE, "none")
      settings.set(SNOOZE_END_TIME, "0")
      return
    }

    settings.set(SNOOZE_PREFERENCE, identifier)

    if (identifier == "30_mins") {
      settings.set(SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 30) + "")
    } else if (identifier == "1_hour") {
      settings.set(SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60) + "")
    } else if (identifier == "3_hours") {
      settings.set(SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60 * 3) + "")
    } else if (identifier == "12_hours") {
      settings.set(SNOOZE_END_TIME, (new Date().getTime() + 1000 * 60 * 60 * 12) + "")
    }
  }

  // Boolean Preference: Default to FALSE
  const AUTO_HIDE_MENU_BAR = 'auto-hide-menu-bar'

  var shouldAutoHideMenuBar = () => {
    return settings.has(AUTO_HIDE_MENU_BAR) && settings.get(AUTO_HIDE_MENU_BAR) === "true"
  }

  // Boolean Preference: Default to TRUE
  const SHOW_NOTIFICATIONS = 'show-notifications'
  const NOTIFICATION_SOUNDS = 'notification-sounds'
  const NOTIFICATION_SENDER_PREVIEWS = 'notification-sender-previews'
  const NOTIFICATION_MESSAGE_PREVIEWS = 'notification-message-previews'
  const BADGE_DOCK_ICON = 'badge-dock-icon'
  const USE_SPELLCHECK = 'use-spellcheck'
  const OPEN_AT_LOGIN = 'open-at-login'
  const MINIMIZE_TO_TRAY = 'minimize-to-tray'

  var shouldShowNotifications = () => {
    return !settings.has(SHOW_NOTIFICATIONS) || settings.get(SHOW_NOTIFICATIONS) === "true"
  }

  var shouldPlayNotificationSounds = () => {
    return !settings.has(NOTIFICATION_SOUNDS) || settings.get(NOTIFICATION_SOUNDS) === "true"
  }

  var shouldDisplayNotificationSenderPreviews = () => {
    return !settings.has(NOTIFICATION_SENDER_PREVIEWS) || settings.get(NOTIFICATION_SENDER_PREVIEWS) === "true"
  }

  var shouldDisplayNotificationMessagePreviews = () => {
    return !settings.has(NOTIFICATION_MESSAGE_PREVIEWS) || settings.get(NOTIFICATION_MESSAGE_PREVIEWS) === "true"
  }

  var shouldBadgeDockIcon = () => {
    return !settings.has(BADGE_DOCK_ICON) || settings.get(BADGE_DOCK_ICON) === "true"
  }

  var shouldUseSpellcheck = () => {
    return !settings.has(USE_SPELLCHECK) || settings.get(USE_SPELLCHECK) === "true"
  }

  var shouldOpenAtLogin = () => {
    return !settings.has(OPEN_AT_LOGIN) || settings.get(OPEN_AT_LOGIN) === "true"
  }

  var shouldMinimizeToTray = () => {
    return !settings.has(MINIMIZE_TO_TRAY) || settings.get(MINIMIZE_TO_TRAY) === "true"
  }

  // Modifier
  function togglePreference(id, getter) {
    settings.set(id, !getter() + "")
  }

  module.exports.isSnoozeActive = isSnoozeActive
  module.exports.currentSnoozeSelection = currentSnoozeSelection
  module.exports.snooze = snooze

  module.exports.autoHideMenuBar = shouldAutoHideMenuBar
  module.exports.showNotifications = shouldShowNotifications
  module.exports.notificationSounds = shouldPlayNotificationSounds
  module.exports.notificationSenderPreviews = shouldDisplayNotificationSenderPreviews
  module.exports.notificationMessagePreviews = shouldDisplayNotificationMessagePreviews
  module.exports.badgeDockIcon = shouldBadgeDockIcon
  module.exports.useSpellcheck = shouldUseSpellcheck
  module.exports.openAtLogin = shouldOpenAtLogin
  module.exports.minimizeToTray = shouldMinimizeToTray

  module.exports.toggleAutoHideMenuBar = () => { togglePreference(AUTO_HIDE_MENU_BAR, shouldAutoHideMenuBar) }
  module.exports.toggleShowNotifications = () => { togglePreference(SHOW_NOTIFICATIONS, shouldShowNotifications) }
  module.exports.toggleNotificationSounds = () => { togglePreference(NOTIFICATION_SOUNDS, shouldPlayNotificationSounds) }
  module.exports.toggleNotificationSenderPreviews = () => { togglePreference(NOTIFICATION_SENDER_PREVIEWS, shouldDisplayNotificationSenderPreviews) }
  module.exports.toggleNotificationMessagePreviews = () => { togglePreference(NOTIFICATION_MESSAGE_PREVIEWS, shouldDisplayNotificationMessagePreviews) }
  module.exports.toggleBadgeDockIcon = () => { togglePreference(BADGE_DOCK_ICON, shouldBadgeDockIcon) }
  module.exports.toggleUseSpellcheck = () => { togglePreference(USE_SPELLCHECK, shouldUseSpellcheck) }
  module.exports.toggleOpenAtLogin = () => { togglePreference(OPEN_AT_LOGIN, shouldOpenAtLogin) }
  module.exports.toggleMinimizeToTray = () => { togglePreference(MINIMIZE_TO_TRAY, shouldMinimizeToTray) }
}())
