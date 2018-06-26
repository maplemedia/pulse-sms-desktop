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

  const storage = require('electron-json-storage')
  const HttpsProxyAgent = require('https-proxy-agent')
  const debug = false

  let proxyAgent = null

  var prepare = (browser) => {
    browser.webContents.executeJavaScript('localStorage.getItem("account_id")', true).then((id) => {
      id = id.replace(/\"/g, "")
      storage.set("account_id", id)
      log("saved account id: " + id)
    })

    browser.webContents.executeJavaScript('localStorage.getItem("hash")', true).then((hash) => {
      hash = hash.replace(/\"/g, "")
      storage.set("hash", hash)
      log("saved hash: " + hash)
    })

    browser.webContents.executeJavaScript('localStorage.getItem("salt")', true).then((salt) => {
      salt = salt.replace(/\"/g, "")
      storage.set("salt", salt)
      log("saved salt: " + salt)
    })
  }

  function log(message) {
    if (debug) {
      console.log(message)
    }
  }

  function getProxyAgent() {
    // use the PULSE_PROXY or HTTPS_PROXY environment variable to determine if we should use a proxy
    var envProxy = process.env.PULSE_PROXY || process.env.HTTPS_PROXY
    if (!proxyAgent && envProxy) {
      console.log("Attempting to get a proxy agent with \"" + envProxy + "\"")
      proxyAgent = HttpsProxyAgent(envProxy)
    }

    return proxyAgent
  }

  module.exports.prepare = prepare
  module.exports.getProxyAgent = getProxyAgent
}())
