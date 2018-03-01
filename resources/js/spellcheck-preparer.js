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

 const { SpellCheckerProvider } = require('electron-hunspell')

const hazardous = require ('hazardous')
const path = require('path')

window.spellCheck = new SpellCheckerProvider()
window.spellCheck.initialize()

setTimeout(() => {
  window.spellCheck.loadDictionary('en',
    path.join(__dirname, '../dict/en-US.dic'),
    path.join(__dirname, '../dict/en-US.aff')
  )

  window.spellCheck.switchDictionary('en')
}, 3000)
