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
    return this._surfaceStore.getSurface(
      this.workspace.activeWindow
        ? this.workspace.activeWindow.output
        : this.workspace.activeScreen,
      this.workspace.currentActivity,
      this.workspace.currentDesktop
    );
  }

  public set currentSurface(value: ISurface) {
    const ksrf = value as KWinSurface;

    /* NOTE: only supports switching desktops */
    // TODO: fousing window on other screen?
    // TODO: find a way to change activity

    if (this.workspace.currentDesktop.id !== ksrf.vDesktop.id)
      this.workspace.currentDesktop = ksrf.vDesktop;
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

  public get currentSurfaces(): ISurface[] {
    const currentSurfaces: ISurface[] = [];
    this.workspace.screens.forEach((output) => {
      currentSurfaces.push(
        this._surfaceStore.getSurface(
          output,
          this.workspace.currentActivity,
          this.workspace.currentDesktop
        )
      );
    });
    return currentSurfaces;
  }

  public get cursorPosition(): [number, number] | null {
    const workspacePos = this.workspace.cursorPos;
    return workspacePos !== null ? [workspacePos.x, workspacePos.y] : null;
  }

  //#endregion

  public workspace: Workspace;
  private shortcuts: IShortcuts;
  private engine: TilingEngine;
  private control: TilingController;
  private windowMap: WrapperMap<Window, WindowClass>;
  private entered: boolean;
  private _surfaceStore: KWinSurfaceStore;

  constructor(api: Api) {
    KWIN = api.kwin;
    CONFIG = KWINCONFIG = new KWinConfig();
    this.workspace = api.workspace;
    this.shortcuts = api.shortcuts;
    this.engine = new TilingEngine();
    this.control = new TilingController(this.engine);
    this.windowMap = new WrapperMap(
      (client: Window) => KWinWindow.generateID(client),
      (client: Window) =>
        new WindowClass(
          new KWinWindow(client, this.workspace, this._surfaceStore)
        )
    );
    this.entered = false;
    this._surfaceStore = new KWinSurfaceStore(this.workspace);
  }

  /*
   * Main
   */

  public main() {
    LOG?.send(LogModules.printConfig, undefined, `Config: ${CONFIG}`);
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
      const window = this.windowMap.add(client);
      if (client.maximizeMode > 0) {
        (window.window as KWinWindow).maximized = true;
        // it can set maximized to false when window start already with maximized flag
        // client.setMaximize(false, false);
      }
      this.control.onWindowAdded(this, window);
      if (window.state !== WindowState.Unmanaged) {
        this.bindWindowEvents(window, client);
        LOG?.send(LogModules.newWindowAdded, "", debugWin(client), {
          winClass: [`${client.resourceClass}`],
        });
        return window;
      } else {
        this.windowMap.remove(client);
        LOG?.send(LogModules.newWindowUnmanaged, "", debugWin(client), {
          winClass: [`${client.resourceClass}`],
        });
      }
    } else {
      LOG?.send(LogModules.newWindowFiltered, "", debugWin(client), {
        winClass: [`${client.resourceClass}`],
      });
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

  public moveWindowsToScreen(
    windowsToScreen: [output: Output, windows: WindowClass[]][]
  ) {
    let clients: Window[] = [];
    windowsToScreen.forEach(([targetOutput, windows]) => {
      windows.forEach((window) => {
        let client = (window.window as KWinWindow).window;
        clients.push(client);
        client.minimized = true;
        this.workspace.sendClientToScreen(client, targetOutput);
      });
      this.setTimeout(() => {
        clients.forEach((client) => {
          client.minimized = false;
        });
        this.control.engine.arrange(this, "moveWindowsToScreen");
      }, 100);
    });
  }

  public moveToScreen(window: WindowClass, direction: Direction) {
    let client = (window.window as KWinWindow).window;
    let output = client.output;
    let neighbor = this.getNeighborOutput(direction, output);
    if (neighbor === null || neighbor === undefined) return;
    client.minimized = true;
    this.workspace.sendClientToScreen(client, neighbor);
    this.setTimeout(() => {
      client.minimized = false;
      this.workspace.activeWindow = client;
      this.control.engine.arrange(this, "moveToScreen");
    }, 100);
  }

  private getNeighborOutput(
    direction: Direction,
    source: Output
  ): Output | null {
    let retOutput = null;
    let intersection = 0;
    let sourceRect = toRect(source.geometry);
    function isOutputCandidate(
      targetRect: Rect,
      coordinate: "x" | "y"
    ): boolean {
      let currentIntersection = sourceRect.intersection(targetRect, coordinate);
      if (currentIntersection > intersection) {
        intersection = currentIntersection;
        return true;
      }
      return false;
    }
    for (let target of this.workspace.screens) {
      if (target === source) continue;
      let targetRect = toRect(target.geometry);
      switch (direction) {
        case "left": {
          if (sourceRect.x === targetRect.maxX) {
            if (isOutputCandidate(targetRect, "y")) retOutput = target;
          }
          break;
        }
        case "right": {
          if (sourceRect.maxX === targetRect.x) {
            if (isOutputCandidate(targetRect, "y")) retOutput = target;
          }
          break;
        }
        case "up": {
          if (sourceRect.y === targetRect.maxY) {
            if (isOutputCandidate(targetRect, "x")) retOutput = target;
          }
          break;
        }
        case "down": {
          if (sourceRect.maxY === targetRect.y) {
            if (isOutputCandidate(targetRect, "x")) retOutput = target;
          }
          break;
        }
        default: {
          break;
        }
      }
    }
    return retOutput;
  }

  private bindShortcut() {
    const callbackShortcut = (shortcut: Shortcut) => {
      return () => {
        LOG?.send(
          LogModules.shortcut,
          `Shortcut pressed:`,
          `${ShortcutStr(shortcut)}`
        );
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

    this.shortcuts
      .getRaiseSurfaceCapacity()
      .activated.connect(callbackShortcut(Shortcut.RaiseSurfaceCapacity));
    this.shortcuts
      .getLowerSurfaceCapacity()
      .activated.connect(callbackShortcut(Shortcut.LowerSurfaceCapacity));

    const callbackShortcutLayout = (layoutClass: ILayoutClass) => {
      return () => {
        LOG?.send(LogModules.shortcut, "shortcut layout", `${layoutClass.id}`);
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
      .activated.connect(callbackShortcutLayout(BinaryTreeLayout));
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
   * KWin emits signals as soon as window states are changed, even when
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
      warning(`ProtectFunc: Error raised line: ${e.lineNumber}. Error: ${e}`);
    } finally {
      this.entered = false;
    }
  }
  //#endregion
  //TODO: add signal Vdesktop.aboutToBeDestroyed
  //add signal workspace.activity.removed
  private bindEvents() {
    this.connect(this.workspace.screensChanged, () => {
      LOG?.send(LogModules.screensChanged, "eventFired");
      this.control.onSurfaceUpdate(this);
    });

    this.connect(this.workspace.virtualScreenGeometryChanged, () => {
      LOG?.send(LogModules.virtualScreenGeometryChanged, "eventFired");
      this.control.onSurfaceUpdate(this);
    });

    this.connect(
      this.workspace.currentActivityChanged,
      (activityId: string) => {
        LOG?.send(
          LogModules.currentActivityChanged,
          "eventFired",
          `Activity ID:${activityId}`
        );
        this.control.onCurrentActivityChanged(this);
      }
    );

    this.connect(
      this.workspace.currentDesktopChanged,
      (virtualDesktop: VirtualDesktop) => {
        LOG?.send(
          LogModules.currentDesktopChanged,
          "eventFired",
          `Virtual Desktop. name:${virtualDesktop.name}, id:${virtualDesktop.id}`
        );
        this.control.onSurfaceUpdate(this);
      }
    );

    this.connect(this.workspace.windowAdded, (client: Window) => {
      if (!client) return;
      LOG?.send(
        LogModules.windowAdded,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId}`,
        { winClass: [`${client.resourceClass}`] }
      );
      const window = this.addWindow(client);
      if (client.active && window !== null)
        this.control.onWindowFocused(this, window);
    });

    this.connect(this.workspace.windowActivated, (client: Window) => {
      if (!client) return;
      LOG?.send(
        LogModules.windowActivated,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId}`,
        { winClass: [`${client.resourceClass}`] }
      );
      const window = this.windowMap.get(client);
      if (client.active && window !== null)
        this.control.onWindowFocused(this, window);
    });

    this.connect(this.workspace.windowRemoved, (client: Window) => {
      if (!client) return;
      LOG?.send(
        LogModules.windowRemoved,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId}`,
        { winClass: [`${client.resourceClass}`] }
      );
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
    this.connect(client.activitiesChanged, () => {
      LOG?.send(
        LogModules.activitiesChanged,
        "eventFired",
        `window: caption:${client.caption} internalID:${
          client.internalId
        }, activities: ${client.activities.join(",")}`,
        { winClass: [`${client.resourceClass}`] }
      );
      this.control.onWindowChanged(
        this,
        window,
        "activity=" + client.activities.join(",")
      );
    });

    this.connect(client.bufferGeometryChanged, () => {
      LOG?.send(
        LogModules.bufferGeometryChanged,
        "eventFired",
        `Window: caption:${client.caption} internalId:${client.internalId}, moving:${moving}, resizing:${resizing}, actualGeometry: ${window.actualGeometry}, commitGeometry:${window.geometry}`,
        { winClass: [`${client.resourceClass}`] }
      );
      if (moving) this.control.onWindowMove(window);
      else if (resizing) this.control.onWindowResize(this, window);
      else {
        if (!window.actualGeometry.equals(window.geometry))
          this.control.onWindowGeometryChanged(this, window);
      }
    });

    this.connect(client.desktopsChanged, () => {
      LOG?.send(
        LogModules.desktopsChanged,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId}, desktops: ${client.desktops}`,
        { winClass: [`${client.resourceClass}`] }
      );
      this.control.onWindowChanged(this, window, "Window's desktop changed.");
    });

    this.connect(client.fullScreenChanged, () => {
      LOG?.send(
        LogModules.fullScreenChanged,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId}, fullscreen: ${client.fullScreen}`,
        { winClass: [`${client.resourceClass}`] }
      );
      this.control.onWindowChanged(
        this,
        window,
        "fullscreen=" + client.fullScreen
      );
    });

    this.connect(client.interactiveMoveResizeStepped, (geometry) => {
      LOG?.send(
        LogModules.interactiveMoveResizeStepped,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId},interactiveMoveResizeStepped:${geometry}`,
        { winClass: [`${client.resourceClass}`] }
      );
      if (client.resize) return;
      this.control.onWindowDragging(this, window, geometry);
    });

    this.connect(client.maximizedAboutToChange, (mode: MaximizeMode) => {
      LOG?.send(
        LogModules.maximizedAboutToChange,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId},maximizedAboutToChange:${mode}`,
        { winClass: [`${client.resourceClass}`] }
      );
      // const maximized = mode === MaximizeMode.MaximizeFull;
      (window.window as KWinWindow).maximized = (mode as number) > 0;
      this.control.onWindowMaximizeChanged(this, window);
    });

    this.connect(client.minimizedChanged, () => {
      LOG?.send(
        LogModules.minimizedChanged,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId},minimized:${client.minimized}`,
        { winClass: [`${client.resourceClass}`] }
      );
      if (KWINCONFIG.preventMinimize) {
        client.minimized = false;
        this.workspace.activeWindow = client;
      } else {
        var comment = client.minimized ? "minimized" : "unminimized";
        this.control.onWindowChanged(this, window, comment);
      }
    });

    this.connect(client.moveResizedChanged, () => {
      LOG?.send(
        LogModules.moveResizedChanged,
        "eventFired",
        `Window: caption:${client.caption} internalId:${client.internalId}, moving:${moving}, resizing:${resizing}`,
        { winClass: [`${client.resourceClass}`] }
      );
      if (moving !== client.move) {
        moving = client.move;
        if (moving) {
          this.control.onWindowMoveStart(window);
        } else {
          this.control.onWindowMoveOver(this, window);
        }
      }
      if (resizing !== client.resize) {
        resizing = client.resize;
        if (resizing) this.control.onWindowResizeStart(window);
        else this.control.onWindowResizeOver(this, window);
      }
    });

    this.connect(client.outputChanged, () => {
      LOG?.send(
        LogModules.outputChanged,
        "eventFired",
        `window: caption:${client.caption} internalID:${client.internalId} output: ${client.output.name}`,
        { winClass: [`${client.resourceClass}`] }
      );
      this.control.onWindowChanged(
        this,
        window,
        "screen=" + client.output.name
      );
    });
    if (CONFIG.floatSkipPager) {
      this.connect(client.skipPagerChanged, () => {
        this.control.onWindowSkipPagerChanged(this, window, client.skipPager);
      });
    }
  }

  // TODO: private onConfigChanged = () => {
  //     this.loadConfig();
  //     this.engine.arrange();
  // }
  /* NOTE: check `bindEvents` for details */
}
