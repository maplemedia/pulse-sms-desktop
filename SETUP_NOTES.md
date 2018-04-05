# Setup for Publishing the Native Apps

We are going to publish releases to the [messenger-issues](https://github.com/klinker-apps/messenger-issues) repo. It will support auto updates as well.

First, set up a [personal access token](https://github.com/blog/1509-personal-api-tokens) for an account that has access to push to the above repo. It must have the `repo` permission.

You will need to set this to an environment variable and make it accessible from `sudo`:

1. `nano ~/.bash_profile` and add `export GH_TOKEN=<your-token>`
2. `sudo visudo` and add the `Defaults     env_keep += "GH_TOKEN"` line

You will need to set up a signing certificate for Mac. I have used my MacOS developer certs.

Instructions on generating a cert are [here](https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingCertificates/MaintainingCertificates.html#//apple_ref/doc/uid/TP40012582-CH31-SW6).

To set up the Windows code signing cert, we will need to add two more `sudo` enabled environment variables:

1. `export WIN_CSC_LINK=<cert>.p12`
2. `export WIN_CSC_KEY_PASSWORD=<cert-password>`
3. Add them to the `visudo` list as shown above.

### Generating the Icons for the Native Apps

I used this site and uploaded the `1024x1024` icon in the `build/` directory: https://iconverticons.com/online/

# Preparing Windows for Electron development

1. Install git-bash: https://git-scm.com/download/win
2. Install Python 2.x and have it set the environment variable on install: https://www.python.org/downloads/
2. Install Node/NPM: http://blog.teamtreehouse.com/install-node-js-npm-windows
3. Install the Windows build tools:
  * Open `cmd` as an administrator
  * Run: `npm install --global --production windows-build-tools`
  * Run: `npm config set msvs_version 2015 --global`
  * Close any shell or `cmd` windows
4. Run `npm install` against the desktop app directory
5. Run `npm start` to run the desktop app
6. Add the `GH_TOKEN` environment variable
7. Add the `WIN_CSC_LINK` environment variables
8. Add the `WIN_CSC_KEY_PASSWORD` environment variable


### Building the App

```
$ .\node_modules\.bin\electron-builder.cmd build --windows nsis --x64 --ia32
```

### Building and publishing

```
$ .\node_modules\.bin\electron-builder.cmd build --windows nsis --x64 --ia32 --publish always
