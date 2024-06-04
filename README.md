# Kröhnkite

A dynamic tiling extension for KWin 6.

Kröhnkite is mainly inspired by [dwm][] from suckless folks, and aims to
provide rock solid stability while fully integrating into KWin.

The name of the script is from mineral [Kröhnkite][wikipedia]; it starts with
K and looks cool.

[dwm]: https://dwm.suckless.org/
[wikipedia]: https://en.wikipedia.org/wiki/Kr%C3%B6hnkite

![screenshot](img/screenshot.png)

## Features

- DWM-like window tiling
  - Dynamically tile windows, rather than manually placing each.
  - Floating windows
- Fully integrates into KWin features, including:
  - **Multi-screen**
  - **Activities & Virtual desktop**
  - Basic window management (minimize, fullscreen, switching, etc)
- Multiple Layout Support
  - Tiling layout
  - Monocle layout
  - Desktop-friendly layouts (Spread, Stair)

## Development Requirement

- Typescript (tested w/ 3.1.x)
- GNU Make
- p7zip (7z)

## Look at me

Delete unused KWin shortcuts
`qdbus6 org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.cleanUp`

## Installation

You can install Kröhnkite in multiple ways.

### Using .kwinscript package file

You can download `krohnkite-x.x.kwinscript` file, and install it through
_System Settings_.

1.  Download the kwinscript file
2.  Open `System Settings` > `Window Management` > `KWin Scripts`
3.  Press `Import KWin script...` on the top-right corner
4.  Select the downloaded file

Alternatively, through command-line:

    kpackagetool6 -t KWin/Script -i krohnkite.kwinscript # installing new script
    kpackagetool6 -t kwin/script -u krohnkite.kwinscript # upgrading existing script

To uninstall the package:

    kpackagetool6 -t kwin/script -r krohnkite

### Installing from Git repository

The simplest method would be:

    make install
    make uninstall # to uninstall the script

This will automatically build and install kwinscript package.

You can also manually build package file using:

    make package

The generated package file can be imported from "KWin Script" dialog.

### Simply Trying Out

Krohnkite can be temporarily loaded without installing the script:

    make run
    make stop

Note that Krohnkite can destroy itself completely once it is disabled, so no
restart is required to deactivated it.

### Search a window parameters to filter, float etc.

1. Krohnkite options: ![options](img/conf.png)
2. Options->Debug new Windows
3. Reboot
4. Run Kdevelop
5. Type in filter string: krohnkite
6. All created windows krohnkite working with will be there.
7. Every debug entry contains parameters except those that are false and empty.

## Default Key Bindings

| Key              | Action             |
| ---------------- | ------------------ |
| Meta + .         | Focus Next         |
| Meta + ,         | Focus Previous     |
|                  |                    |
| Meta + J         | Focus Down         |
| Meta + K         | Focus Up           |
| Meta + H         | Focus Left         |
| Meta + L         | Focus Right        |
|                  |                    |
| Meta + Shift + J | Move Down/Next     |
| Meta + Shift + K | Move Up/Previous   |
| Meta + Shift + H | Move Left          |
| Meta + Shift + L | Move Right         |
|                  |                    |
| Meta + I         | Increase           |
| Meta + D         | Decrease           |
| Meta + F         | Toggle Floating    |
| Meta + \         | Cycle Layout       |
|                  |                    |
| Meta + Return    | Set as Master      |
|                  |                    |
| Meta + T         | Use Tile Layout    |
| Meta + M         | Use Monocle Layout |
| _unbound_        | Use Spread Layout  |
| _unbound_        | Use Stair Layout   |

## Tips

### Setting Up for Multi-Screen

Krohnkite supports multi-screen setup, but KWin has to be configured to unlock
the full potential of the script.

1. Enable `Separate Screen Focus` feature, the GUI controls are gone since KDE6, but the option is still accessible through the configs:
         kwriteconfig6 --file ~/.config/kwinrc --group Windows --key ActiveMouseScreen false
         kwriteconfig6 --file ~/.config/kwinrc --group Windows --key SeparateScreenFocus true
2. Bind keys for global shortcut `Switch to Next/Previous Screen`
   (Recommend: `Meta + ,` / `Meta + .`)
3. Bind keys for global shortcut `Window to Next/Previous Screen`
   (Recommend: `Meta + <` / `Meta + >`)

### Removing Title Bars

Breeze window decoration can be configured to completely remove title bars from
all windows:

1. `System Setting` > `Application Style` > `Window Decorations`
2. Click `Configure Breeze` inside the decoration preview.
3. `Window-Specific Overrides` tab > `Add` button
4. Enter the followings, and press `Ok`:
   - `Regular expression to match`: `.*`
   - Tick `Hide window title bar`

### Changing Border Colors

Changing the border color makes it easier to identify current window. This is
convinient if title bars are removed.

1.  Open `~/.config/kdeglobals` with your favorite editor
2.  Scroll down and find `[WM]` section
3.  Append the followings to the section:

    - `frame=61,174,233`: set the border color of active window to _RGB(61,174,233)_
    - `inactiveFrame=239,240,241`: set the border color of inactive window to _RGB(239,240,241)_

    Here's a nice 2-liner that'll do it for you:

         kwriteconfig5 --file ~/.config/kdeglobals --group WM --key frame 61,174,233
         kwriteconfig5 --file ~/.config/kdeglobals --group WM --key inactiveFrame  239,240,241

4.  You must **restart** your session to see changes. (i.e. re-login, reboot)

Note: the RGB values presented here are for the default Breeze theme

Note: You might also need to set the border size larger than the theme's default:
`System Settings` > `Application Style` > `Window Decorations`: Untick `Use theme's default window border size` and adjust the size (right from the checkbox).

### Setting Minimum Geometry Size

Some applications like discord and KDE settings dont tile nicely as they have a minimum size requirement.
This causes the applications to overlap with other applications. To mitigate this we can set minimum size for all windows to be 0.

1. `System Setting` > `Window Management` > `Window Rules`
2. Click on `+ Add New...`
3. Set `Window class` to be `Unimportant`
4. Set `Window types` to `Normal Window`
5. Click `+ Add Properties...`
6. Add the `Minimum Size` Property
7. Set the fields to `Force` and `0` x `0`
8. Apply

### Prevent borders and shadows from disappearing.

When a window is marked "maximized" in Breeze theme, its borders are removed to save screen space.
This behavior may not be preferable depending on your setup. This can be mitigated by disabling maximized windows using Window Rules.

1. `System Setting` > `Window Management` > `Window Rules`
2. Click on `+ Add New...`
3. Set `Window class` to be `Unimportant`
4. Set `Window types` to `Normal Window`
5. Click `+ Add Properties...`
6. Add the `Maximized horizontally` and `Maximized vertically` Properties.
7. Set the options to `Force` and `No`.
8. Apply

## Useful Development Resources

- [KWin Scripting Tutorial](https://techbase.kde.org/Development/Tutorials/KWin/Scripting)
- [KWin Scripting API 4.9 Reference](https://techbase.kde.org/Development/Tutorials/KWin/Scripting/API_4.9)
- Adding configuration dialog
  - [Development/Tutorials/Plasma/JavaScript/ConfigDialog](https://techbase.kde.org/Development/Tutorials/Plasma/JavaScript/ConfigDialog)
  - [Development/Tutorials/Using KConfig XT](https://techbase.kde.org/Development/Tutorials/Using_KConfig_XT)
- `*.ui` files can be edited with [Qt Designer](http://doc.qt.io/qt-5/qtdesigner-manual.html).
  It's very straight-forward if you're used to UI programming.
