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
  const { app } = require('electron')

  const WebSocket = require('ws')
  const https = require('https')
  const storage = require('electron-json-storage')
  const url = require('url');
  const preferences = require('../preferences.js')
  const decrypt = require('../decrypt.js')
  const notifier = require('../notifier.js')
  const preparer = require('./websocket-preparer.js')

  let windowProvider = null
  let tray = null
  let socket = null
  let isRunning = false
  let lastPing = new Date().getTime()
  let lastOpenedConnection = new Date().getTime()
  let currentTimeout = null

  var openWebSocket = (provider, trayMenu) => {
    if (typeof provider !== "undefined" && provider != null) {
      setWindowProvider(provider)
    }

    if (typeof trayMenu !== "undefined" && trayMenu != null) {
      tray = trayMenu
    }

    storage.get("account_id", (error, id) => {
      if (error || id == null || id.length == 0) {
        scheduleRunCheck()
      } else {
        open(id)
      }
    })
  }

  var closeWebSocket = () => {
    try {
      socket.terminate()
    } catch (err) {}
  }

  function open(account_id) {
    closeWebSocket()

    socket = new WebSocket("wss://api.messenger.klinkerapps.com/api/v1/stream?account_id=" + account_id, {agent: preparer.getProxyAgent()})

    socket.on("error", (err) =>  {
      console.log("ws error: " + err)
    })

    socket.on("open", () =>  {
      console.log("websocket: opened connection")
      lastOpenedConnection = new Date().getTime()
      isRunning = true

      socket.send(JSON.stringify({
        "command": "subscribe",
        "identifier": "{\"channel\":\"NotificationsChannel\"}"
      }))
    })

    socket.on("close", () => {
      console.log("websocket: closed connection")
      if (new Date().getTime() - lastOpenedConnection < 2000) {
        console.log("websocket: invalid account id request")
        scheduleRunCheck(5 * 60 * 1000)
      }
    })

    socket.on("message", (event) => {
      var json = JSON.parse(event)
      if (typeof json.type === "undefined") {
        if (typeof json.message !== "undefined" && json.message.operation == "added_message") {
          newMessage(json.message.content)
          updateBadgeCount(1000)
        } else if (typeof json.message !== "undefined" && (json.message.operation == "read_conversation" || json.message.operation == "removed_conversation")) {
          updateBadgeCount()
        }
      }

      lastPing = new Date().getTime()
    })

    scheduleRunCheck()
    updateBadgeCount()
  }

  function checkRunning() {
    if (new Date().getTime() - lastPing > 1000 * 70) {
      console.log("restarting the connection")
      isRunning = false

      if (windowProvider.getBrowserView()) {
        preparer.prepare(windowProvider.getBrowserView())
      }

      openWebSocket(windowProvider)
    }

    scheduleRunCheck()
  }

  function scheduleRunCheck(time) {
    if (currentTimeout != null) {
      clearTimeout(currentTimeout)
    }

    if (typeof time === "undefined") {
      time = 60 * 1000
    }

    currentTimeout = setTimeout(checkRunning, time)
  }

  function newMessage(message) {
    storage.getMany(["account_id", "hash", "salt"], (error, result) => {
      if (typeof result === "undefined" || result == null) {
        return
      }

      var aesKey = null;

      try {
        aesKey = decrypt.buildAesKey(result.account_id, result.hash, result.salt)
      } catch (err) {
        return
      }

      try {
        message.data = decrypt.decrypt(message.data, aesKey)
      } catch (err) {
        message.data = ""
      }
      try {
        message.mime_type = decrypt.decrypt(message.mime_type, aesKey)
      } catch (err) {}
      try {
        message.message_from = decrypt.decrypt(message.from, aesKey)
      } catch (err) {}

      if (message.type == 0) {
        console.log("providing notification")

        var conversationUrl = "https://api.messenger.klinkerapps.com/api/v1/conversations/" +
          message.conversation_id + "?account_id=" + result.account_id
        getJSON(conversationUrl, (conversation) => {
          if (typeof conversation !== "undefined" && conversation != null) {
            try {
              provideNotification(message, conversation, aesKey)
            } catch (err) {}
          }
        })
      }
    })
  }

  function updateBadgeCount(timeout) {
    if (!preferences.badgeDockIcon()) {
      return
    }

    if (typeof timeout === "undefined") {
      timeout = 0
    }

    setTimeout(() => {
      storage.get("account_id", (error, id) => {
        if (!error && id.length != 0) {
          var urlToGet = "https://api.messenger.klinkerapps.com/api/v1/conversations/unread_count?account_id=" + id
          getJSON(urlToGet, (unread) => {
            if (typeof unread !== "undefined" && unread != null) {
              try {
                if (process.platform === 'win32' && tray != null) {
                  setWindowsIndicator(unread, tray)
                } else {
                  setMacLinuxIndicators(unread, tray)
                }
              } catch (err) {
                console.log(err)
              }
            }
          })
        }
      })
    }, timeout)
  }

  function setWindowsIndicator(unread, tray) {
    const path = require('path')

    let window = windowProvider.getWindow()
    if (unread.unread > 0) {
      tray.setImage(path.resolve(__dirname, "assets/tray/windows-unread.ico"))
      if (typeof window !== "undefined" && window != null) {
        window.setOverlayIcon(path.resolve(__dirname, "assets/windows-overlay.ico"), unread.unread + " Unread Conversations")
      }
    } else {
      tray.setImage(path.resolve(__dirname, "assets/tray/windows.ico"))
      if (typeof window !== "undefined" && window != null) {
        window.setOverlayIcon(null, "No Unread Conversations")
      }
    }
  }

  function setMacLinuxIndicators(unread, tray) {
    app.setBadgeCount(unread.unread)
    if (process.platform === 'darwin' && tray != null) {
      tray.setTitle(unread.unread == 0 ? "" : unread.unread + "")
    }
  }

  function provideNotification(message, conversation, aesKey) {
    if (conversation == null) {
      return
    }

    var title = decrypt.decrypt(conversation.title, aesKey)
    var phone_numbers = decrypt.decrypt(conversation.phone_numbers, aesKey)
    var snippet = message.mime_type === "text/plain" ? message.data : "New Message"

    if (snippet === "") {
      closeWebSocket()
      return
    }

    if (phone_numbers.indexOf(",") > 0 && message.message_from.length > 0) {
      snippet = message.message_from + ": " + snippet
    }

    if (conversation.private_notifications) {
      title = "New Message"
      snippet = ""
    }

    if (!conversation.mute) {
      notifier.notify(title, snippet, message.conversation_id, conversation.private_notifications, windowProvider)
    }
  }

  function getJSON(urlToGet, successHandler) {
    var options = url.parse(urlToGet)
    options.agent = preparer.getProxyAgent()
    var req = https.get(options, (response) => {
      var body = ''
      response.on('data', (d) => {
        body += d
      })
      response.on('end', () => {
        try {
          successHandler(JSON.parse(body))
        } catch (err) { }
      })
      response.on('error', () => {

      })
    })

    req.on("error", (error) => {

    })
  }

  var isWebSocketRunning = () => {
    return isRunning
  }

  var setWindowProvider = (provider) => {
    windowProvider = provider
  }

  module.exports.openWebSocket = openWebSocket
  module.exports.closeWebSocket = closeWebSocket
  module.exports.isWebSocketRunning = isWebSocketRunning
  module.exports.setWindowProvider = setWindowProvider
}())
