// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
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
 * TilingController translates events to actions, implementing high-level
 * window management logic.
 *
 * In short, this class is just a bunch of event handling methods.
 */

class TilingController {
  public engine: TilingEngine;
  private isDragging: boolean;
  private dragCompleteTime: number | null;

  public constructor(engine: TilingEngine) {
    this.engine = engine;
    this.isDragging = false;
    this.dragCompleteTime = null;
  }

  public onSurfaceUpdate(ctx: IDriverContext, comment: string): void {
    debugObj(() => ["onSurfaceUpdate", { comment }]);
    this.engine.arrange(ctx);
  }
  public onCurrentActivityChanged(
    ctx: IDriverContext,
    activityId: string
  ): void {
    debugObj(() => ["onCurrentActivityChanged", { activityId: activityId }]);
    this.engine.arrange(ctx);
  }

  public onCurrentSurfaceChanged(ctx: IDriverContext): void {
    debugObj(() => ["onCurrentSurfaceChanged", { srf: ctx.currentSurface }]);
    this.engine.arrange(ctx);
  }

  public onWindowAdded(ctx: IDriverContext, window: WindowClass): void {
    debugObj(() => ["onWindowAdded", { window }]);
    this.engine.manage(window);

    /* move window to next surface if the current surface is "full" */
    if (window.tileable) {
      const srf = ctx.currentSurface;
      const tiles = this.engine.windows.getVisibleTiles(srf);
      const layoutCapcity = this.engine.layouts.getCurrentLayout(srf).capacity;
      if (layoutCapcity !== undefined && tiles.length > layoutCapcity) {
        const nsrf = ctx.currentSurface.next();
        if (nsrf) {
          // (window.window as KWinWindow).client.desktop = (nsrf as KWinSurface).desktop;
          window.surface = nsrf;
          ctx.currentSurface = nsrf;
        }
      }
    }

    this.engine.arrange(ctx);
  }

  public onWindowRemoved(ctx: IDriverContext, window: WindowClass): void {
    debugObj(() => ["onWindowRemoved", { window }]);
    this.engine.unmanage(window);
    this.engine.arrange(ctx);
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
    windowRect: Rect
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
          srf.workingArea as Rect
        )
      ) {
        this.engine.arrange(ctx);
      }

      this.dragCompleteTime = Date.now();
    }
    this.isDragging = false;
  }

  public onWindowMoveOver(ctx: IDriverContext, window: WindowClass): void {
    debugObj(() => ["onWindowMoveOver", { window }]);
    /* swap window by dragging */
    if (window.state === WindowState.Dragging) {
      window.setState(WindowState.Tiled);
      this.engine.arrange(ctx);
      return;
    }

    if (window.state === WindowState.Tiled) {
      const tiles = this.engine.windows.getVisibleTiles(ctx.currentSurface);
      const cursorPos = ctx.cursorPosition || window.actualGeometry.center;

      const targets = tiles.filter(
        (tile) =>
          tile !== window && tile.actualGeometry.includesPoint(cursorPos)
      );

      if (targets.length === 1) {
        this.engine.windows.swap(window, targets[0]);
        this.engine.arrange(ctx);
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
        this.engine.arrange(ctx);
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
    debugObj(() => ["onWindowResize", { window }]);
    if (
      CONFIG.adjustLayout &&
      CONFIG.adjustLayoutLive &&
      window.state === WindowState.Tiled
    ) {
      this.engine.adjustLayout(window);
      this.engine.arrange(ctx);
    } else if (window.state === WindowState.Docked) {
      this.engine.adjustDock(window);
      this.engine.arrange(ctx);
    }
  }

  public onWindowResizeOver(ctx: IDriverContext, window: WindowClass): void {
    debugObj(() => ["onWindowResizeOver", { window }]);
    if (CONFIG.adjustLayout && window.tiled) {
      this.engine.adjustLayout(window);
      this.engine.arrange(ctx);
    } else if (window.state === WindowState.Docked) {
      this.engine.adjustDock(window);
      this.engine.arrange(ctx);
    } else if (!CONFIG.adjustLayout) this.engine.enforceSize(ctx, window);
  }

  public onWindowMaximizeChanged(
    ctx: IDriverContext,
    window: WindowClass,
    maximized: boolean
  ): void {
    this.engine.arrange(ctx);
  }

  public onWindowGeometryChanged(
    ctx: IDriverContext,
    window: WindowClass
  ): void {
    debugObj(() => ["onWindowGeometryChanged", { window }]);
    this.engine.enforceSize(ctx, window);
  }

  // NOTE: accepts `null` to simplify caller. This event is a catch-all hack
  // by itself anyway.
  public onWindowChanged(
    ctx: IDriverContext,
    window: WindowClass | null,
    comment?: string
  ): void {
    if (window) {
      debugObj(() => ["onWindowChanged", { window, comment }]);

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
      this.engine.arrange(ctx);
    }
  }

  public onWindowFocused(ctx: IDriverContext, window: WindowClass) {
    window.timestamp = new Date().getTime();

    if (CONFIG.raiseAllMosaicTileWindowsAtOnce && window.isMosaicTile) {
      this.engine.windows.getVisibleWindows(ctx.currentSurface)
          .filter(w => w.isMosaicTile)
          .forEach(w => {
            w.window.raise();
          });
    }
  }

  public onDesktopsChanged(ctx: IDriverContext, window: WindowClass) {
    if (window.state !== WindowState.Docked)
      window.state = WindowState.Undecided;
  }

  public onShortcut(ctx: IDriverContext, input: Shortcut, data?: any) {
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

    const window = ctx.currentWindow;
    if (
      window !== null &&
      window.state === WindowState.Docked &&
      this.engine.handleDockShortcut(ctx, window, input)
    ) {
      this.engine.arrange(ctx);
      return;
    } else if (this.engine.handleLayoutShortcut(ctx, input, data)) {
      this.engine.arrange(ctx);
      return;
    }

    switch (input) {
      case Shortcut.FocusNext:
        this.engine.focusOrder(ctx, +1);
        break;
      case Shortcut.FocusPrev:
        this.engine.focusOrder(ctx, -1);
        break;

      case Shortcut.FocusUp:
        this.engine.focusDir(ctx, "up");
        break;
      case Shortcut.FocusDown:
        this.engine.focusDir(ctx, "down");
        break;
      case Shortcut.DWMLeft:
      case Shortcut.FocusLeft:
        this.engine.focusDir(ctx, "left");
        break;
      case Shortcut.DWMRight:
      case Shortcut.FocusRight:
        this.engine.focusDir(ctx, "right");
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
        this.engine.swapDirOrMoveFloat(ctx, "up");
        break;
      case Shortcut.SwapDown:
        this.engine.swapDirOrMoveFloat(ctx, "down");
        break;
      case Shortcut.SwapLeft:
        this.engine.swapDirOrMoveFloat(ctx, "left");
        break;
      case Shortcut.SwapRight:
        this.engine.swapDirOrMoveFloat(ctx, "right");
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
    }
    this.engine.arrange(ctx);
  }
}
