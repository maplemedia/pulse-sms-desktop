# Pulse SMS - Desktop

![preview](artwork/preview.png)

An Electron app that wraps the Pulse web app. With this desktop implementation, you get:

* Native notifications through persistent web socket
* Notification customizations
* Notification snooze support
* Spell check
* Always active window
* Tray/Menu Bar support
* Unread badge support for Mac and Linux
* Hidden menu bar option for Windows and Linux

The desktop app is built on top of Electron's `BrowserView`, rather than Chromium's `webview`.

## Build Instructions

1. Install Electron and project dependencies:

```
$ npm install -g electron
$ yarn install
```

2. Run the app:

```
$ yarn start
```

The app will only run if you have shut down any other instances. To ensure that only one web socket connection is made and managed, only a single instance of Pulse is allowed to run. If you use `npm start` while another instance is running, it will simply display the window of that old instance, instead of starting the app.

## Packaging Information

To package the apps for each platform:

```
$ yarn

// MacOS (dmg)
$ yarn run build-mac

// Windows (installer with 32 and 64 bit support)
$ yarn run build-windows

// Linux (deb and AppImage)
$ yarn run build-linux
```

## Contributing

Please fork this repository and contribute back using [pull requests](https://github.com/klinker-apps/messenger-desktop/pulls). Features can be requested using issues on our Pulse platform issue tracker, rather than creating issues directly on this repo: https://github.com/klinker-apps/messenger-issues.

This project was originally a JavaScript project and I am not a big fan of JavaScript. As such, the project now uses Typescript. Many things aren't structured in a very Typescript-y way. I will continue to improve this, as I have time. Pull requests would be more than welcome, to make the app more Typescript-y.

## License

    Copyright 2019 Luke Klinker

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
