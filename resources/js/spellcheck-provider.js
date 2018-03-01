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

  const { Menu, MenuItem } = require('electron')

  var prepareMenu = (window, browser) => {
    browser.webContents.addListener('context-menu', (event, text) => {
      let menu = new Menu()
      let isTextInput = text.isEditable || (text.inputFieldType && text.inputFieldType !== 'none')
      let hasSuggestion = isTextInput && text.misspelledWord && text.misspelledWord.length >= 1

      if (hasSuggestion) {
        browser.webContents.executeJavaScript('window.spellCheck.getSuggestion("' + text.misspelledWord + '")', true).then((suggestions) => {
          suggestions.forEach((value) => {
            let item = new MenuItem({
              label: value,
              click: () => browser.webContents.replaceMisspelling(value)
            })

            menu.append(item)
          })

          if (suggestions.length == 0) {
            let item = new MenuItem({
              label: "No suggestions available."
            })

            menu.append(item)
          }

          menu.popup(window, { async: true })
        })
      }
    })
  }

  module.exports.prepareMenu = prepareMenu
}())
