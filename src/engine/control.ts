/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

/**
 * TilingController translates events to actions, implementing high-level
 * window management logic.
 *
 * In short, this class is just a bunch of event handling methods.
 */

class TilingController {
  public engine: TilingEngine;
  private isDragging: boolean;
  private dragCompleteTime: number | null;
  private _metaShortcuts: { [key: string]: Shortcut };

  public constructor(engine: TilingEngine) {
    this.engine = engine;
    this.isDragging = false;
    this.dragCompleteTime = null;
    this._metaShortcuts = this._initMetaShortcuts();
  }

  public onSurfaceUpdate(ctx: IDriverContext): void {
    this.engine.arrange(ctx, getMethodName());
  }

  public onCurrentActivityChanged(ctx: IDriverContext): void {
    this.engine.arrange(ctx, getMethodName());
  }

  public onCurrentSurfaceChanged(ctx: IDriverContext): void {
    this.engine.arrange(ctx, getMethodName());
  }

  public onWindowAdded(ctx: IDriverContext, window: WindowClass): void {
    this.engine.manage(window);

    /* move window to next surface if the current surface is "full" */
    if (window.isTileable) {
      const srf = ctx.currentSurface;
      const tiles = this.engine.windows.getVisibleTiles(srf);
    }
    if (
      window.state !== WindowState.NativeMaximized &&
      window.state !== WindowState.NativeFullscreen
    )
      this.engine.arrange(ctx, getMethodName());
  }

  public onWindowSkipPagerChanged(
    ctx: IDriverContext,
    window: WindowClass,
    skipPager: boolean,
  ) {
    if (skipPager) window.state = WindowState.Floating;
    else window.state = WindowState.Undecided;
    this.engine.arrange(ctx, getMethodName());
  }

  public onWindowRemoved(ctx: IDriverContext, window: WindowClass): void {
    this.engine.unmanage(window);
    this.engine.arrange(ctx, getMethodName());
  }

  public onWindowMoveStart(window: WindowClass): void {
    /* do nothing */
  }

  public onWindowMove(window: WindowClass): void {
    /* do nothing */
  }

  public onWindowDragging(
    ctx: IDriverContext,
    window: WindowClass,
    windowRect: Rect,
  ): void {
    if (this.isDragging) return;
    // 100 milliseconds - min interval between run this function
    if (
      this.dragCompleteTime !== null &&
      Date.now() - this.dragCompleteTime < 100
    )
      return;
    const srf = ctx.currentSurface;
    const layout = this.engine.layouts.getCurrentLayout(srf);
    if (!layout.drag) return;
    // if (!(layout.drag && layout.isDragging && layout.isDragging(window)))
    //   return;
    if (window.state === WindowState.Tiled) {
      window.setDraggingState();
    }
    if (window.state === WindowState.Dragging) {
      if (
        layout.drag(
          new EngineContext(ctx, this.engine),
          toRect(windowRect),
          window,
          srf.workingArea as Rect,
        )
      ) {
        this.engine.arrange(ctx, getMethodName());
      }

      this.dragCompleteTime = Date.now();
    }
    this.isDragging = false;
  }

  public onWindowMoveOver(ctx: IDriverContext, window: WindowClass): void {
    /* swap window by dragging */
    if (window.state === WindowState.Dragging) {
      window.setState(WindowState.Tiled);
      this.engine.arrange(ctx, getMethodName());
      return;
    }

    if (window.state === WindowState.Tiled) {
      const tiles = this.engine.windows.getVisibleTiles(ctx.currentSurface);
      const cursorPos = ctx.cursorPosition || window.actualGeometry.center;

      const targets = tiles.filter(
        (tile) =>
          tile !== window && tile.actualGeometry.includesPoint(cursorPos),
      );

      if (targets.length === 1) {
        this.engine.windows.swap(window, targets[0]);
        this.engine.arrange(ctx, getMethodName());
        return;
      }
    }

    /* ... or float window by dragging */
    if (!CONFIG.keepTilingOnDrag && window.state === WindowState.Tiled) {
      const diff = window.actualGeometry.subtract(window.geometry);
      const distance = Math.sqrt(diff.x ** 2 + diff.y ** 2);
      // TODO: arbitrary constant
      if (distance > 30) {
        window.floatGeometry = window.actualGeometry;
        window.state = WindowState.Floating;
        this.engine.arrange(ctx, getMethodName());
        return;
      }
    }

    /* ... or return to the previous position */
    window.commit();
  }

  public onWindowResizeStart(window: WindowClass): void {
    /* do nothing */
  }

  public onWindowResize(ctx: IDriverContext, window: WindowClass): void {
    if (
      CONFIG.adjustLayout &&
      CONFIG.adjustLayoutLive &&
      window.state === WindowState.Tiled
    ) {
      this.engine.adjustLayout(window);
      this.engine.arrange(ctx, getMethodName());
    } else if (window.state === WindowState.Docked) {
      this.engine.adjustDock(window);
      this.engine.arrange(ctx, getMethodName());
    }
  }

  public onWindowResizeOver(ctx: IDriverContext, window: WindowClass): void {
    if (CONFIG.adjustLayout && window.isTiled) {
      this.engine.adjustLayout(window);
      this.engine.arrange(ctx, getMethodName());
    } else if (window.state === WindowState.Docked) {
      this.engine.adjustDock(window);
      this.engine.arrange(ctx, getMethodName());
    } else if (!CONFIG.adjustLayout) this.engine.enforceSize(ctx, window);
  }

  public onWindowMaximizeChanged(
    ctx: IDriverContext,
    window: WindowClass,
  ): void {
    this.engine.arrange(ctx, getMethodName());
  }

  public onWindowGeometryChanged(
    ctx: IDriverContext,
    window: WindowClass,
  ): void {
    LOG?.send(
      LogModules.bufferGeometryChanged,
      "enforceSize",
      `Window: id:${window.id} actualGeometry: ${window.actualGeometry}, commitGeometry:${window.geometry}`,
      { winClass: [`${(window.window as KWinWindow).window.resourceClass}`] },
    );
    this.engine.enforceSize(ctx, window);
  }

  // NOTE: accepts `null` to simplify caller. This event is a catch-all hack
  // by itself anyway.
  public onWindowChanged(
    ctx: IDriverContext,
    window: WindowClass | null,
    comment?: string,
  ): void {
    if (window) {
      if (comment === "unminimized") ctx.currentWindow = window;
      const workingArea = window.surface.workingArea;
      if (window.floatGeometry.width > workingArea.width) {
        window.floatGeometry.width = workingArea.width;
      }
      if (window.floatGeometry.height > workingArea.height) {
        window.floatGeometry.height = workingArea.height;
      }
      window.floatGeometry.x =
        workingArea.x + (workingArea.width - window.floatGeometry.width) / 2;
      window.floatGeometry.y =
        workingArea.y + (workingArea.height - window.floatGeometry.height) / 2;
      this.engine.arrange(ctx, getMethodName());
    }
  }

  public onWindowFocused(ctx: IDriverContext, window: WindowClass) {
    window.timestamp = getTime();
  }

  public onDesktopsChanged(ctx: IDriverContext, window: WindowClass) {
    if (window.state !== WindowState.Docked)
      window.state = WindowState.Undecided;
  }

  public onShortcut(ctx: IDriverContext, input: Shortcut, data?: any) {
    if (input === Shortcut.KrohnkiteMeta) {
      ctx.metaPushed();
      return;
    }
    let metaShortcut;
    if (
      ctx.isMetaMode &&
      (metaShortcut = this._getMetaShortcut(input)) !== null
    ) {
      input = metaShortcut;
    }

    let isArrangeNeeded = true;
    if (CONFIG.directionalKeyMode === "dwm") {
      switch (input) {
        case Shortcut.FocusUp:
          input = Shortcut.FocusNext;
          break;
        case Shortcut.FocusDown:
          input = Shortcut.FocusPrev;
          break;
        case Shortcut.FocusLeft:
          input = Shortcut.DWMLeft;
          break;
        case Shortcut.FocusRight:
          input = Shortcut.DWMRight;
          break;
      }
    } else if (CONFIG.directionalKeyMode === "focus") {
      switch (input) {
        case Shortcut.ShiftUp:
          input = Shortcut.SwapUp;
          break;
        case Shortcut.ShiftDown:
          input = Shortcut.SwapDown;
          break;
        case Shortcut.ShiftLeft:
          input = Shortcut.SwapLeft;
          break;
        case Shortcut.ShiftRight:
          input = Shortcut.SwapRight;
          break;
      }
    }

    let currentCapacity: number | null;
    const window = ctx.currentWindow;
    if (
      window !== null &&
      window.state === WindowState.Docked &&
      this.engine.handleDockShortcut(ctx, window, input)
    ) {
      window?.moveMouseToFocus();
      this.engine.arrange(ctx, getMethodName());
      return;
    } else if (this.engine.handleLayoutShortcut(ctx, input, data)) {
      window?.moveMouseToFocus();
      this.engine.arrange(ctx, getMethodName());
      return;
    }

    switch (input) {
      case Shortcut.FocusNext:
        this.engine.focusOrder(ctx, +1);
        isArrangeNeeded = false;
        break;
      case Shortcut.FocusPrev:
        this.engine.focusOrder(ctx, -1);
        isArrangeNeeded = false;
        break;

      case Shortcut.MetaFocusUp:
      case Shortcut.FocusUp:
        isArrangeNeeded = this.engine.focusDir(ctx, "up");
        break;
      case Shortcut.MetaFocusDown:
      case Shortcut.FocusDown:
        isArrangeNeeded = this.engine.focusDir(ctx, "down");
        break;
      case Shortcut.MetaFocusLeft:
      case Shortcut.DWMLeft:
      case Shortcut.FocusLeft:
        isArrangeNeeded = this.engine.focusDir(ctx, "left");
        break;
      case Shortcut.MetaFocusRight:
      case Shortcut.DWMRight:
      case Shortcut.FocusRight:
        isArrangeNeeded = this.engine.focusDir(ctx, "right");
        break;

      case Shortcut.GrowWidth:
        if (window) {
          if (window.state === WindowState.Docked && window.dock) {
            if (
              window.dock.position === DockPosition.left ||
              window.dock.position === DockPosition.right
            ) {
              window.dock.cfg.vWide += 1;
            } else if (
              window.dock.position === DockPosition.top ||
              window.dock.position === DockPosition.bottom
            ) {
              window.dock.cfg.hWide += 1;
            }
          } else this.engine.resizeWindow(window, "east", 1);
        }
        break;
      case Shortcut.ShrinkWidth:
        if (window) {
          if (window.state === WindowState.Docked && window.dock) {
            if (
              window.dock.position === DockPosition.left ||
              window.dock.position === DockPosition.right
            ) {
              window.dock.cfg.vWide -= 1;
            } else if (
              window.dock.position === DockPosition.top ||
              window.dock.position === DockPosition.bottom
            ) {
              window.dock.cfg.hWide -= 1;
            }
          } else this.engine.resizeWindow(window, "east", -1);
        }
        break;
      case Shortcut.GrowHeight:
        if (window) {
          if (window.state === WindowState.Docked && window.dock) {
            if (
              window.dock.position === DockPosition.left ||
              window.dock.position === DockPosition.right
            ) {
              window.dock.cfg.vHeight += 1;
            } else if (
              window.dock.position === DockPosition.top ||
              window.dock.position === DockPosition.bottom
            ) {
              window.dock.cfg.hHeight += 1;
            }
          } else this.engine.resizeWindow(window, "south", 1);
        }
        break;
      case Shortcut.ShrinkHeight:
        if (window) {
          if (window.state === WindowState.Docked && window.dock) {
            if (
              window.dock.position === DockPosition.left ||
              window.dock.position === DockPosition.right
            ) {
              window.dock.cfg.vHeight -= 1;
            } else if (
              window.dock.position === DockPosition.top ||
              window.dock.position === DockPosition.bottom
            ) {
              window.dock.cfg.hHeight -= 1;
            }
          } else this.engine.resizeWindow(window, "south", -1);
        }
        break;

      case Shortcut.ShiftUp:
        if (window) this.engine.swapOrder(window, -1);
        break;
      case Shortcut.ShiftDown:
        if (window) this.engine.swapOrder(window, +1);
        break;

      case Shortcut.SwapUp:
        isArrangeNeeded = this.engine.swapDirOrMoveFloat(ctx, "up");
        break;
      case Shortcut.SwapDown:
        isArrangeNeeded = this.engine.swapDirOrMoveFloat(ctx, "down");
        break;
      case Shortcut.SwapLeft:
        isArrangeNeeded = this.engine.swapDirOrMoveFloat(ctx, "left");
        break;
      case Shortcut.SwapRight:
        isArrangeNeeded = this.engine.swapDirOrMoveFloat(ctx, "right");
        break;

      case Shortcut.SetMaster:
        if (window) this.engine.setMaster(window);
        break;
      case Shortcut.ToggleFloat:
        if (window) this.engine.toggleFloat(window);
        break;
      case Shortcut.ToggleFloatAll:
        this.engine.floatAll(ctx, ctx.currentSurface);
        break;

      case Shortcut.NextLayout:
        this.engine.cycleLayout(ctx, 1);
        break;
      case Shortcut.PreviousLayout:
        this.engine.cycleLayout(ctx, -1);
        break;
      case Shortcut.SetLayout:
        if (typeof data === "string") this.engine.setLayout(ctx, data);
        break;

      case Shortcut.ToggleDock:
        if (window) this.engine.toggleDock(window);
        break;

      case Shortcut.RaiseSurfaceCapacity:
        currentCapacity = this.engine.raiseSurfaceCapacity(ctx);
        ctx.showNotification(
          `Surface capacity: ${currentCapacity !== null ? currentCapacity : "unlimited"}`,
        );
        break;
      case Shortcut.LowerSurfaceCapacity:
        currentCapacity = this.engine.lowerSurfaceCapacity(ctx);
        ctx.showNotification(`Surface capacity: ${currentCapacity}`);
        break;
      case Shortcut.MetaResetSurfaceCapacity:
        currentCapacity = this.engine.ResetSurfaceCapacity(ctx);
        ctx.showNotification(
          `Surface capacity: ${currentCapacity !== null ? currentCapacity : "unlimited"}`,
        );
        isArrangeNeeded = false;
        break;
    }
    if (!isArrangeNeeded) return;
    window?.moveMouseToFocus();
    this.engine.arrange(ctx, getMethodName());
  }

  private _initMetaShortcuts() {
    let metaShortcuts: { [key: string]: Shortcut } = CONFIG.defaultMetaConfig;
    CONFIG.metaConf.forEach((shortcutPair) => {
      let splitted = shortcutPair.split("=").map((p) => p.trim());
      if (splitted.length !== 2) {
        warning(`"Meta Config: ${splitted}" have to has the one equal sign`);
        return;
      }
      let [pushedShortcut, runShortcut] = splitted;
      if (!(pushedShortcut in Shortcut)) {
        warning(`Meta Config: "${pushedShortcut}" unknown shortcut`);
        return;
      } else if (!(runShortcut in Shortcut)) {
        warning(`Meta Config: "${runShortcut}" unknown shortcut`);
        return;
      }
      metaShortcuts[pushedShortcut] = runShortcut as Shortcut;
    });
    return metaShortcuts;
  }

  private _getMetaShortcut(input: Shortcut): Shortcut | null {
    if (input in this._metaShortcuts) {
      return this._metaShortcuts[input];
    } else return null;
  }
}
