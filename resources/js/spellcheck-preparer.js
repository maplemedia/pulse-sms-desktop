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
const { webFrame } = require('electron')
const spellChecker = require('spellchecker')

window.spellCheck = spellChecker
webFrame.setSpellCheckProvider('en-US', {
  spellCheck (words, callback) {
    setTimeout(() => {
      const spellchecker = require('spellchecker')
      const misspelled = words.filter(x => spellchecker.isMisspelled(x))
      callback(misspelled)
    }, 0)
  }
})

// Electron does weird things with contractions: https://github.com/electron/electron/issues/1005
// I am just adding a few common ones, so that they don't get marked as misspelled.
spellChecker.add('doesn')
spellChecker.add('couldn')
spellChecker.add('wouldn')
spellChecker.add('shouldn')
spellChecker.add('isn')
spellChecker.add('wasn')
spellChecker.add('weren')
spellChecker.add('would\'ve')
