// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

/**
 * Abstracts KDE implementation specific details.
 *
 * Driver is responsible for initializing the tiling logic, connecting
 * signals(Qt/KDE term for binding events), and providing specific utility
 * functions.
 */
var KWIN: KWin;

class KWinDriver implements IDriverContext {
  public static backendName: string = "kwin";

  // TODO: split context implementation
  //#region implement properties of IDriverContext (except `setTimeout`)
  public get backend(): string {
    return KWinDriver.backendName;
  }

  public get currentSurface(): ISurface {
    return new KWinSurface(
      this.workspace.activeWindow
        ? this.workspace.activeWindow.output
        : this.workspace.activeScreen,
      this.workspace.currentActivity,
      this.workspace.currentDesktop,
      this.workspace
    );
  }

  public set currentSurface(value: ISurface) {
    const ksrf = value as KWinSurface;

    /* NOTE: only supports switching desktops */
    // TODO: fousing window on other screen?
    // TODO: find a way to change activity

    if (this.workspace.currentDesktop.id !== ksrf.desktop.id)
      this.workspace.currentDesktop = ksrf.desktop;
    if (this.workspace.currentActivity !== ksrf.activity)
      this.workspace.currentActivity = ksrf.activity;
  }

  public get currentWindow(): WindowClass | null {
    const client = this.workspace.activeWindow;
    return client ? this.windowMap.get(client) : null;
  }

  public set currentWindow(window: WindowClass | null) {
    if (window !== null) {
      window.timestamp = new Date().getTime();
      this.workspace.activeWindow = (window.window as KWinWindow).window;
    }
  }

  public get screens(): ISurface[] {
    const screens: ISurface[] = [];
    this.workspace.screens.forEach((screen) => {
      screens.push(
        new KWinSurface(
          screen,
          this.workspace.currentActivity,
          this.workspace.currentDesktop,
          this.workspace
        )
      );
    });
    return screens;
  }

  public get cursorPosition(): [number, number] | null {
    return this.mousePoller.mousePosition;
  }

  //#endregion

  public workspace: Workspace;
  private shortcuts: IShortcuts;
  private engine: TilingEngine;
  private control: TilingController;
  private windowMap: WrapperMap<Window, WindowClass>;
  private entered: boolean;
  private mousePoller: KWinMousePoller;

  constructor(api: Api) {
    KWIN = api.kwin;
    this.workspace = api.workspace;
    this.shortcuts = api.shortcuts;
    this.engine = new TilingEngine();
    this.control = new TilingController(this.engine);
    this.windowMap = new WrapperMap(
      (client: Window) => KWinWindow.generateID(client),
      (client: Window) =>
        new WindowClass(new KWinWindow(client, this.workspace))
    );
    this.entered = false;
    this.mousePoller = new KWinMousePoller();
  }

  /*
   * Main
   */

  public main() {
    CONFIG = KWINCONFIG = new KWinConfig();
    debug(() => "Config: " + KWINCONFIG);

    this.bindEvents();
    this.bindShortcut();

    const clients: Window[] = this.workspace.stackingOrder;
    for (let i = 0; i < clients.length; i++) {
      this.addWindow(clients[i]);
    }
  }

  private addWindow(client: Window): WindowClass | null {
    if (
      !client.deleted &&
      client.pid >= 0 &&
      !client.popupWindow &&
      client.normalWindow &&
      !client.hidden &&
      client.width * client.height > 10
    ) {
      if (CONFIG.debugActiveWin) print(debugWin(client));
      const window = this.windowMap.add(client);
      this.control.onWindowAdded(this, window);
      if (window.state !== WindowState.Unmanaged) {
        this.bindWindowEvents(window, client);
        return window;
      } else {
        this.windowMap.remove(client);
        if (CONFIG.debugActiveWin) print("Unmanaged: " + debugWin(client));
      }
    } else {
      if (CONFIG.debugActiveWin) print("Filtered: " + debugWin(client));
    }
    return null;
  }

  //#region implement methods of IDriverContext`
  public setTimeout(func: () => void, timeout: number) {
    KWinSetTimeout(() => this.enter(func), timeout);
  }

  public showNotification(text: string) {
    if (CONFIG.notificationDuration > 0)
      popupDialog.show(text, CONFIG.notificationDuration);
  }
  //#endregion

  private bindShortcut() {
    const callbackShortcut = (shortcut: Shortcut) => {
      return () => {
        this.enter(() => this.control.onShortcut(this, shortcut));
      };
    };
    this.shortcuts
      .getToggleDock()
      .activated.connect(callbackShortcut(Shortcut.ToggleDock));
    this.shortcuts
      .getFocusNext()
      .activated.connect(callbackShortcut(Shortcut.FocusNext));
    this.shortcuts
      .getFocusPrev()
      .activated.connect(callbackShortcut(Shortcut.FocusPrev));
    this.shortcuts
      .getFocusDown()
      .activated.connect(callbackShortcut(Shortcut.FocusDown));
    this.shortcuts
      .getFocusUp()
      .activated.connect(callbackShortcut(Shortcut.FocusUp));
    this.shortcuts
      .getFocusLeft()
      .activated.connect(callbackShortcut(Shortcut.FocusLeft));
    this.shortcuts
      .getFocusRight()
      .activated.connect(callbackShortcut(Shortcut.FocusRight));

    this.shortcuts
      .getShiftDown()
      .activated.connect(callbackShortcut(Shortcut.ShiftDown));
    this.shortcuts
      .getShiftUp()
      .activated.connect(callbackShortcut(Shortcut.ShiftUp));
    this.shortcuts
      .getShiftLeft()
      .activated.connect(callbackShortcut(Shortcut.ShiftLeft));
    this.shortcuts
      .getShiftRight()
      .activated.connect(callbackShortcut(Shortcut.ShiftRight));

    this.shortcuts
      .getGrowHeight()
      .activated.connect(callbackShortcut(Shortcut.GrowHeight));
    this.shortcuts
      .getShrinkHeight()
      .activated.connect(callbackShortcut(Shortcut.ShrinkHeight));
    this.shortcuts
      .getShrinkWidth()
      .activated.connect(callbackShortcut(Shortcut.ShrinkWidth));
    this.shortcuts
      .getGrowWidth()
      .activated.connect(callbackShortcut(Shortcut.GrowWidth));

    this.shortcuts
      .getIncrease()
      .activated.connect(callbackShortcut(Shortcut.Increase));
    this.shortcuts
      .getDecrease()
      .activated.connect(callbackShortcut(Shortcut.Decrease));

    this.shortcuts
      .getToggleFloat()
      .activated.connect(callbackShortcut(Shortcut.ToggleFloat));
    this.shortcuts
      .getFloatAll()
      .activated.connect(callbackShortcut(Shortcut.ToggleFloatAll));
    this.shortcuts
      .getNextLayout()
      .activated.connect(callbackShortcut(Shortcut.NextLayout));
    this.shortcuts
      .getPreviousLayout()
      .activated.connect(callbackShortcut(Shortcut.PreviousLayout));

    this.shortcuts
      .getRotate()
      .activated.connect(callbackShortcut(Shortcut.Rotate));
    this.shortcuts
      .getRotatePart()
      .activated.connect(callbackShortcut(Shortcut.RotatePart));

    this.shortcuts
      .getSetMaster()
      .activated.connect(callbackShortcut(Shortcut.SetMaster));

    const callbackShortcutLayout = (layoutClass: ILayoutClass) => {
      return () => {
        this.enter(() =>
          this.control.onShortcut(this, Shortcut.SetLayout, layoutClass.id)
        );
      };
    };

    this.shortcuts
      .getTileLayout()
      .activated.connect(callbackShortcutLayout(TileLayout));
    this.shortcuts
      .getMonocleLayout()
      .activated.connect(callbackShortcutLayout(MonocleLayout));
    this.shortcuts
      .getThreeColumnLayout()
      .activated.connect(callbackShortcutLayout(ThreeColumnLayout));
    this.shortcuts
      .getSpreadLayout()
      .activated.connect(callbackShortcutLayout(SpreadLayout));
    this.shortcuts
      .getStairLayout()
      .activated.connect(callbackShortcutLayout(StairLayout));
    this.shortcuts
      .getFloatingLayout()
      .activated.connect(callbackShortcutLayout(FloatingLayout));
    this.shortcuts
      .getQuarterLayout()
      .activated.connect(callbackShortcutLayout(QuarterLayout));
    this.shortcuts
      .getStackedLayout()
      .activated.connect(callbackShortcutLayout(StackedLayout));
    this.shortcuts
      .getColumnsLayout()
      .activated.connect(callbackShortcutLayout(ColumnsLayout));
    this.shortcuts
      .getSpiralLayout()
      .activated.connect(callbackShortcutLayout(SpiralLayout));
    this.shortcuts
      .getBTreeLayout()
      .activated.connect(callbackShortcutLayout(BTreeLayout));
  }

  //#region Helper functions
  /**
   * Binds callback to the signal w/ extra fail-safe measures, like re-entry
   * prevention and auto-disconnect on termination.
   */
  private connect(
    signal: Signal<(...args: any[]) => void>,
    handler: (..._: any[]) => void
  ): () => void {
    const wrapper = (...args: any[]) => {
      /* HACK: `workspace` become undefined when the script is disabled. */
      if (typeof this.workspace === "undefined") signal.disconnect(wrapper);
      else this.enter(() => handler.apply(this, args));
    };
    signal.connect(wrapper);

    return wrapper;
  }

  /**
   * Run the given function in a protected(?) context to prevent nested event
   * handling.
   *
   * KWin emits signals as soons as window states are changed, even when
   * those states are modified by the script. This causes multiple re-entry
   * during event handling, resulting in performance degradation and harder
   * debugging.
   */
  private enter(callback: () => void) {
    if (this.entered) return;

    this.entered = true;
    try {
      callback();
    } catch (e: any) {
      debug(() => "Error raised from line " + e.lineNumber);
      debug(() => e);
    } finally {
      this.entered = false;
    }
  }
  //#endregion

  private bindEvents() {
    this.connect(this.workspace.screensChanged, () =>
      this.control.onSurfaceUpdate(this, "screens (Outputs) changed")
    );

    this.connect(this.workspace.virtualScreenGeometryChanged, () => {
      this.control.onSurfaceUpdate(this, "virtualScreenGeometryChanged");
    });

    this.connect(this.workspace.currentActivityChanged, (activityId: string) =>
      this.control.onCurrentActivityChanged(this, activityId)
    );

    this.connect(
      this.workspace.currentDesktopChanged,
      (virtualDesktop: VirtualDesktop) =>
        this.control.onSurfaceUpdate(this, "currentDesktopChanged")
    );

    this.connect(this.workspace.windowAdded, (client: Window) => {
      const window = this.addWindow(client);
      if (client.active && window !== null)
        this.control.onWindowFocused(this, window);
    });

    this.connect(this.workspace.windowActivated, (client: Window) => {
      const window = this.windowMap.get(client);
      if (client.active && window !== null)
        this.control.onWindowFocused(this, window);
    });

    this.connect(this.workspace.windowRemoved, (client: Window) => {
      const window = this.windowMap.get(client);
      if (window) {
        this.control.onWindowRemoved(this, window);
        this.windowMap.remove(client);
      }
    });

    // TODO: options.configChanged.connect(this.onConfigChanged);
    /* NOTE: How disappointing. This doesn't work at all. Even an official kwin script tries this.
     *       https://github.com/KDE/kwin/blob/master/scripts/minimizeall/contents/code/main.js */
  }

  private bindWindowEvents(window: WindowClass, client: Window) {
    let moving = false;
    let resizing = false;
    this.connect(client.maximizedAboutToChange, (mode: MaximizeMode) => {
      const maximized = mode === MaximizeMode.MaximizeFull;
      (window.window as KWinWindow).maximized = maximized;
      this.control.onWindowMaximizeChanged(this, window, maximized);
    });

    this.connect(client.minimizedChanged, () => {
      if (KWINCONFIG.preventMinimize) {
        client.minimized = false;
        this.workspace.activeWindow = client;

      } else if (client.minimized) {
        this.control.onWindowChanged(this, window, "minimized");

      } else {
        this.control.onWindowChanged(this, window, "unminimized");
        this.control.onWindowFocused(this, window);
      }
    });

    this.connect(client.fullScreenChanged, () =>
      this.control.onWindowChanged(
        this,
        window,
        "fullscreen=" + client.fullScreen
      )
    );
    this.connect(client.desktopsChanged, () =>
      this.control.onDesktopsChanged(this, window)
    );

    this.connect(client.interactiveMoveResizeStepped, (geometry) => {
      if (client.resize) return;
      this.control.onWindowDragging(this, window, geometry);
    });

    this.connect(client.moveResizedChanged, () => {
      debugObj(() => [
        "moveResizedChanged",
        { window, move: client.move, resize: client.resize },
      ]);
      if (moving !== client.move) {
        moving = client.move;
        if (moving) {
          this.mousePoller.start();
          this.control.onWindowMoveStart(window);
        } else {
          this.control.onWindowMoveOver(this, window);
          this.mousePoller.stop();
        }
      }
      if (resizing !== client.resize) {
        resizing = client.resize;
        if (resizing) this.control.onWindowResizeStart(window);
        else this.control.onWindowResizeOver(this, window);
      }
    });

    this.connect(client.bufferGeometryChanged, () => {
      if (moving) this.control.onWindowMove(window);
      else if (resizing) this.control.onWindowResize(this, window);
      else {
        if (!window.actualGeometry.equals(window.geometry))
          this.control.onWindowGeometryChanged(this, window);
      }
    });

    this.connect(client.outputChanged, () =>
      this.control.onWindowChanged(this, window, "screen=" + client.output.name)
    );

    this.connect(client.activitiesChanged, () =>
      this.control.onWindowChanged(
        this,
        window,
        "activity=" + client.activities.join(",")
      )
    );

    this.connect(client.desktopsChanged, () =>
      this.control.onWindowChanged(this, window, "Window's desktop changed.")
    );
  }

  // TODO: private onConfigChanged = () => {
  //     this.loadConfig();
  //     this.engine.arrange();
  // }
  /* NOTE: check `bindEvents` for details */
}
