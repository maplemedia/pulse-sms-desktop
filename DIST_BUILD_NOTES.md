# Setup for Publishing the Native Apps

Releases are published to this repo. The desktop app has an auto-update system built into it. When it reads that there is a new version published to this repo, it will automatically download and install the update, then prompt the user to restart the app to apply the update.

`electron-builder` has a publishing mechanism built in to it that you should use to publish the releases. To use it, first set up a [personal access token](https://github.com/blog/1509-personal-api-tokens) for an account that has access to push to the above repo. It must have the `repo` permission.

You will need to set this to an environment variable and make it accessible from `sudo`:

1. `nano ~/.bash_profile` and add `export GH_TOKEN=<your-token>`
2. `sudo visudo` and add the `Defaults     env_keep += "GH_TOKEN"` line

With that setup, you will be able to build an upload the releases to GitHub. I build the Linux, Mac, and Windows apps on their respective platforms: so I have three different build machines set up.

### Building a Linux Release

You will need `npm` and `yarn` installed.

There is no code-signing available for Linux builds. Just run the command:

```
$ sudo yarn publish-linux
```

### Building a MacOS Release

You will need `npm` and `yarn` installed.

I have used my MacOS developer certs to sign the MacOS app. `electron-builder` will just read the certificates available from your keychain. To distribute a production version of the MacOS app, you will need to import my developer cert into your keychain: https://support.apple.com/guide/keychain-access/add-certificates-to-a-keychain-kyca2431/mac

On top os signing the app, with MacOS Catalina (`10.14.5`), Apple requires DMG files to be notarized by the distributer. The files that I distribute are all signed and notarized by me. The noterization is already set up in the app, you will just need to add the credentials to a `.env` file:

```
APPLEID=test@someemail.com
APPLEIDPASS=xxxx-tttt-vvvv-aaaa
```

After the keychain and noterization setup is complete, run the publish command:

```
$ sudo yarn publish-mac
```

### Building a Windows Release

#### Preparing Windows for Electron Development

1. Install git-bash: https://git-scm.com/download/win
2. Install Python 2.x and have it set the environment variable on install: https://www.python.org/downloads/
2. Install Node/NPM: http://blog.teamtreehouse.com/install-node-js-npm-windows
3. Install the Windows build tools:
  * Open `cmd` as an administrator
  * Run: `npm install --global --production windows-build-tools`
  * Run: `npm config set msvs_version 2015 --global`
  * Close any shell or `cmd` windows

#### Set up Code-Signing for Windows

The Windows `exe` file is signed with a developer certificate. To set up the Windows code signing cert, we will need to add two more `sudo` enabled environment variables, as we did above:

1. `export WIN_CSC_LINK=<cert>.p12`
2. `export WIN_CSC_KEY_PASSWORD=<cert-password>`
3. Add them to the `visudo` list as shown above.

#### Publishing the Windows Release

Once those are set up, you can just run:

```
$ sudo yarn publish-windows
```


### Building the App

```
$ .\node_modules\.bin\electron-builder.cmd build --windows nsis --x64 --ia32
```

### Building and publishing

```
$ .\node_modules\.bin\electron-builder.cmd build --windows nsis --x64 --ia32 --publish always
```