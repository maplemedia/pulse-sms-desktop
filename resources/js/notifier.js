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
  const { BrowserWindow, Notification, app } = require('electron')

  const path = require('path')
  const url = require('url')
  const https = require('https')
  const storage = require('electron-json-storage')
  const encrypt = require('./decrypt.js')
  const preferences = require('./preferences.js')

  let lastNotificationTime = new Date().getTime()
  let windowProvider = null

  var notify = (title, snippet, conversation_id, provider) => {
    windowProvider = provider

    if (!shouldProvideNotification() || title == null || snippet == null || title.length == 0) {
      console.log("notification shouldn't be shown")
      return
    }

    if (!preferences.notificationSenderPreviews()) {
      title = "New Message"
    }

    if (!preferences.notificationMessagePreviews()) {
      snippet = ""
    }

    // if (process.platform === 'win32') {
    //   windowsNotification(title, snippet, conversation_id)
    // } else if (process.platform == 'darwin') {
    //   macNotification(title, snippet, conversation_id)
    // } else {
      genericNotification(title, snippet, conversation_id)
    // }
  }

  function genericNotification(title, snippet, conversation_id) {
    var options = {
      title: title,
      body: snippet,
      silent: !preferences.notificationSounds(),
      hasReply: true,
      replyPlaceholder: "Reply to " + title
    }

    if (process.platform !== 'darwin') {
      options.icon = path.join(__dirname, '../images/notification-icon.png')
    }

    var notification = new Notification(options)

    notification.on('reply', (event, reply) => {
      sendMessage(reply, conversation_id)
      dismissNotification(conversation_id)
      markAsRead(conversation_id)
    })

    notification.on('click', (event) => {
      var link = "https://messenger.klinkerapps.com/messages.html?conversation_id=" + conversation_id

      if (windowProvider.getWindow() !== null) {
        windowProvider.getBrowserView().webContents.loadURL(link)
        windowProvider.getWindow().show()
        windowProvider.getWindow().focus()

        if (process.platform === "darwin") {
          app.dock.show()
        }
      } else {
        createWindow(link)
      }
    })

    notification.show()
  }

  function shouldProvideNotification() {
    if ((new Date().getTime() - lastNotificationTime) > 5000) {
      lastNotificationTime = new Date().getTime()
      return preferences.showNotifications() && !preferences.isSnoozeActive()
    } else {
      return false
    }
  }

  function createWindow(link) {
    windowProvider.createMainWindow()
    setTimeout(() => {
      windowProvider.getBrowserView().webContents.loadURL(link)
    }, 1000)
  }

  function createReplyWindow(link) {
    if (windowProvider.getReplyWindow() !== null) {
      windowProvider.getReplyWindow().webContents.executeJavaScript("document.getElementById('messenger').loadURL('" + link + "')")
      windowProvider.getReplyWindow().show()
      windowProvider.getReplyWindow().focus()
    } else {
      windowProvider.createReplyWindow()
      setTimeout(() => {
        windowProvider.getReplyWindow().webContents.executeJavaScript("document.getElementById('messenger').loadURL('" + link + "')")
      }, 500)
    }
  }

  function sendMessage(text, conversation_id) {
    console.log("sending message: " + text)
    storage.getMany(["account_id", "hash", "salt"], (error, result) => {
      var aesKey = encrypt.buildAesKey(result.account_id, result.hash, result.salt)
      var data = JSON.stringify({
        account_id: result.account_id,
        device_id: generateId(),
        device_conversation_id: conversation_id,
        message_type: 2,
        data: encrypt.encrypt(text, aesKey),
        timestamp: new Date().getTime(),
        mime_type: encrypt.encrypt("text/plain", aesKey),
        read: true,
        seen: true,
        sent_device: 3
      })

      var options = {
        hostname: 'api.messenger.klinkerapps.com',
        path: '/api/v1/messages/add',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      var req = https.request(options)

      req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`)
      })

      req.write(data)
      req.end()
    })
  }

  function dismissNotification(conversation_id) {
    storage.getMany(["account_id"], (error, result) => {
      var data = JSON.stringify({
        account_id: result.account_id,
        id: conversation_id
      })

      var options = {
        hostname: 'api.messenger.klinkerapps.com',
        path: '/api/v1/accounts/dismissed_notification',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      var req = https.request(options)

      req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`)
      })

      req.write(data)
      req.end()
    })
  }

  function markAsRead(conversation_id) {
    storage.getMany(["account_id"], (error, result) => {
      var data = JSON.stringify({
        account_id: result.account_id
      })

      var options = {
        hostname: 'api.messenger.klinkerapps.com',
        path: '/api/v1/conversations/read/' + conversation_id,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      var req = https.request(options)

      req.on('error', (e) => {
        console.log(`problem with request: ${e.message}`)
      })

      req.write(data)
      req.end()
    })
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function generateId() {
    return getRandomInt(1, 922337203685477)
  }

  module.exports.notify = notify
}())

// NODE-NOTIFIER support
// would need to move these back into the class.

// function macNotification(title, snippet, conversation_id) {
//   var macNotifier = new notifier.NotificationCenter({
//     customPath: path.join(__dirname, '../Pulse.app/Contents/MacOS/pulse-sms'),
//   })
//
//   macNotifier.notify({
//     title: title,
//     group: title,
//     message: snippet,
//     sound: preferences.notificationSounds(),
//     closeLabel: "Close",
//     // wait: true,
//     // actions: 'Dismiss',
//     reply: true
//   }, (error, response, metadata) => {
//     if (metadata.activationValue === "Dismiss") {
//       dismissNotification(conversation_id)
//     }
//   })
//
//   // the reply didn't work great, because it would time out. Whenever you entered text for more than ~15 seconds,
//   // the reply would time out and it wouldn't pass the result to this callback. Hopefully I can re-enable this
//   // with future versions of the node-notifier library.
//   // TO RE-ENABLE: remove the actions from the options hash and uncomment the "reply" option.
//   macNotifier.on('replied', (obj, options, metadata) => {
//     var message = metadata.activationValue
//     sendMessage(message, conversation_id)
//     dismissNotification(conversation_id)
//     markAsRead(conversation_id)
//   })
//
//   macNotifier.on('click', (obj, options, metadata) => {
//     var link = "https://messenger.klinkerapps.com/messages.html?conversation_id=" + conversation_id
//
//     if (typeof metadata !== "undefined" && metadata.activationValue === "Reply") {
//       createReplyWindow(link)
//     } else if (windowProvider.getWindow() !== null) {
//       windowProvider.getBrowserView().webContents.loadURL(link)
//       windowProvider.getWindow().show()
//       windowProvider.getWindow().focus()
//       app.dock.show()
//     } else {
//       createWindow(link)
//     }
//   })
// }

// function windowsNotification(title, snippet, conversation_id) {
//   const WindowsToaster = notifier.WindowsToaster
//   var windowsNotifier = new WindowsToaster({
//     withFallback: true
//   })
//
//   windowsNotifier.notify({
//     title: title,
//     message: snippet,
//     icon: path.join(__dirname, '../images/notification-icon.png'),
//     sound: preferences.notificationSounds(),
//     wait: true,
//     appName: "xyz.klinker.messenger"
//   }, (error, response) => {
//     console.log(response)
//   })
//
//   windowsNotifier.on('click', () => {
//     var link = "https://messenger.klinkerapps.com/messages.html?conversation_id=" + conversation_id
//     if (windowProvider.getWindow() !== null) {
//       windowProvider.getBrowserView().webContents.loadURL(link)
//       windowProvider.getWindow().show()
//       windowProvider.getWindow().focus()
//     } else {
//       createWindow(link)
//     }
//   })
// }
