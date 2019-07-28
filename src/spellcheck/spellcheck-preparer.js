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

const { attachSpellCheckProvider, SpellCheckerProvider } = require('electron-hunspell')
const fs = require('fs')
const path = require('path')

const init = async () => {
  const spellCheck = new SpellCheckerProvider();

  window.spellCheck = spellCheck;
  await spellCheck.initialize();

  await spellCheck.loadDictionary(
    'en',
    fs.readFileSync(path.join(__dirname, 'assets/dict/en-US.dic')),
    fs.readFileSync(path.join(__dirname, 'assets/dict/en-US.aff'))
  );

  const attached = await attachSpellCheckProvider(spellCheck);
  setTimeout(async () => attached.switchLanguage('en'), 3000);
};

init();
