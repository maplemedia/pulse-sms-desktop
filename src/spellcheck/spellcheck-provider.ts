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

import { app, BrowserView, BrowserWindow, dialog, Menu, MenuItem, SaveDialogReturnValue, shell } from "electron";
import * as fs from "fs";

export default class SpellcheckProvider {

  public prepareMenu = (window: BrowserWindow, browser: BrowserView) => {
    browser.webContents.addListener("context-menu", async (_: any, params: any) => {
      const menu = new Menu();
      const isTextInput = params.isEditable || (params.inputFieldType && params.inputFieldType !== "none");
      const hasSuggestion = isTextInput && params.misspelledWord && params.misspelledWord.length >= 1;

      if (hasSuggestion) {
        const suggestions = await browser.webContents
          .executeJavaScript('window.spellCheck.getSuggestion("' + params.misspelledWord + '")');

        suggestions.forEach((value: any): void => {
          const item = new MenuItem({
            click: (): void => browser.webContents.replaceMisspelling(value),
            label: value,
          });

          menu.append(item);
        });

        if (suggestions.length === 0) {
          menu.append(new MenuItem({ label: "No suggestions available." }));
        }

        menu.append(new MenuItem({ type: "separator" }));
        this.appendGenericContextMenu(menu, params, isTextInput);
        menu.popup(window as any);
      } else {
        this.appendGenericContextMenu(menu, params, isTextInput);

        if (menu.items.length > 0) {
          menu.popup(window as any);
        }
      }
    });
  }

  private appendGenericContextMenu = (menu: any, params: any, isTextInput: boolean): void => {
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
        click: (): void => {
          const options = { defaultPath: app.getPath("downloads") + "/image.jpeg" };
          dialog.showSaveDialog(null, options)
            .then((value: SaveDialogReturnValue): void => {
              if (!value.canceled && value.filePath) {
                const imageData = (params.linkURL || params.srcURL)
                  .replace(/^data:(image\/jpeg|undefined);base64,/, "");
                fs.writeFile(value.filePath, imageData, "base64", (): void => {
                  // no-op
                });
              }
            });
        },
        label: "Save Image As...",
      }));
    }
  }
}
