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

import { app, dialog, Menu, MenuItem, shell } from "electron";
import * as fs from "fs";

export default class SpellcheckProvider {

  public prepareMenu = (window, browser) => {
    browser.webContents.addListener("context-menu", async (event, params) => {
      const menu = new Menu();
      const isTextInput = params.isEditable || (params.inputFieldType && params.inputFieldType !== "none");
      const hasSuggestion = isTextInput && params.misspelledWord && params.misspelledWord.length >= 1;

      if (hasSuggestion) {
        const suggestions = await browser.webContents
          .executeJavaScript('window.spellCheck.getSuggestion("' + params.misspelledWord + '")');

        suggestions.forEach((value) => {
          const item = new MenuItem({
            click: () => browser.webContents.replaceMisspelling(value),
            label: value,
          });

          menu.append(item);
        });

        if (suggestions.length === 0) {
          menu.append(new MenuItem({ label: "No suggestions available." }));
        }

        menu.append(new MenuItem({ type: "separator" }));
        this.appendGenericContextMenu(menu, params, isTextInput);
        menu.popup(window);
      } else {
        this.appendGenericContextMenu(menu, params, isTextInput);

        if (menu.items.length > 0) {
          menu.popup(window);
        }
      }
    });
  }

  private appendGenericContextMenu = (menu, params, isTextInput) => {
    if (params.selectionText) {
      menu.append(new MenuItem({ role: "copy" }));

      if (isTextInput) {
        menu.append(new MenuItem({ role: "cut" }));
      }
    }

    if (isTextInput) {
      menu.append(new MenuItem({ role: "paste" }));
    }

    if (params.linkText) {
      menu.append(new MenuItem({
        click: () => shell.openExternal(params.linkText),
        label: "Open in Browser",
      }));
    }

    if (params.mediaType === "image") {
      menu.append(new MenuItem({
        click: () => {
          const options = { defaultPath: app.getPath("downloads") + "/image.jpeg" };
          dialog.showSaveDialog(null, options, (path) => {
            if (path) {
              const imageData = (params.linkURL || params.srcURL).replace(/^data:(image\/jpeg|undefined);base64,/, "");
              fs.writeFile(path, imageData, "base64", (err) => { });
            }
          });
        },
        label: "Save Image As...",
      }));
    }
  }
}
