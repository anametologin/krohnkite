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

type Direction = "up" | "down" | "left" | "right";

/**
 * Maintains tiling context and performs various tiling actions.
 */
class TilingEngine {
  public layouts: LayoutStore;
  public windows: WindowStore;
  public docks: DockStore;
  private _defaultGaps: DefaultGapsCfg | null;
  private _gapsSurfacesCfg: gapsSurfaceCfg[];

  constructor() {
    this.layouts = new LayoutStore();
    this.windows = new WindowStore();
    this.docks = new DockStore();
    this._defaultGaps = null;
    this._gapsSurfacesCfg = [];
  }

  /**
   * Adjust layout based on the change in size of a tile.
   *
   * This operation is completely layout-dependent, and no general implementation is
   * provided.
   *
   * Used when tile is resized using mouse.
   */
  public adjustLayout(basis: WindowClass) {
    let delta = basis.geometryDelta;
    if (delta === null) return;
    const srf = basis.surface;
    const layout = this.layouts.getCurrentLayout(srf);
    if (layout.adjust) {
      const gaps = this.getGaps(srf);
      const area = srf.workingArea.gap(
        gaps.left,
        gaps.right,
        gaps.top,
        gaps.bottom
      );
      const tiles = this.windows.getVisibleTiles(srf);
      layout.adjust(area, tiles, basis, delta, gaps.between);
    }
  }

  public adjustDock(basis: WindowClass) {
    if (basis.actualGeometry === basis.geometry) return;
    let widthDiff = basis.actualGeometry.width - basis.geometry.width;
    let heightDiff = basis.actualGeometry.height - basis.geometry.height;
    let dockCfg = basis.dock!.cfg;
    const workingArea = basis.surface.workingArea;

    switch (basis.dock!.position) {
      case DockPosition.left:
      case DockPosition.right:
        dockCfg.vHeight =
          dockCfg.vHeight + (100 * heightDiff) / workingArea.height;
        dockCfg.vWide = dockCfg.vWide + (100 * widthDiff) / workingArea.width;
        break;
      case DockPosition.top:
      case DockPosition.bottom:
        dockCfg.hHeight =
          dockCfg.hHeight + (100 * heightDiff) / workingArea.height;
        dockCfg.hWide = dockCfg.hWide + (100 * widthDiff) / workingArea.width;
        break;
    }
  }

  /**
   * Resize the current floating window.
   *
   * @param window a floating window
   */
  public resizeFloat(
    window: WindowClass,
    dir: "east" | "west" | "south" | "north",
    step: -1 | 1
  ) {
    const srf = window.surface;

    // TODO: configurable step size?
    const hStepSize = srf.workingArea.width * 0.05;
    const vStepSize = srf.workingArea.height * 0.05;

    let hStep, vStep;
    switch (dir) {
      case "east":
        (hStep = step), (vStep = 0);
        break;
      case "west":
        (hStep = -step), (vStep = 0);
        break;
      case "south":
        (hStep = 0), (vStep = step);
        break;
      case "north":
        (hStep = 0), (vStep = -step);
        break;
    }

    const geometry = window.actualGeometry;
    const width = geometry.width + hStepSize * hStep;
    const height = geometry.height + vStepSize * vStep;

    window.forceSetGeometry(new Rect(geometry.x, geometry.y, width, height));
  }

  /**
   * Resize the current tile by adjusting the layout.
   *
   * Used by grow/shrink shortcuts.
   */
  public resizeTile(
    basis: WindowClass,
    dir: "east" | "west" | "south" | "north",
    step: -1 | 1
  ) {
    const srf = basis.surface;
    const gaps = this.getGaps(srf);

    if (dir === "east") {
      const maxX = basis.geometry.maxX;
      const easternNeighbor = this.windows
        .getVisibleTiles(srf)
        .filter((tile) => tile.geometry.x >= maxX);
      if (easternNeighbor.length === 0) {
        dir = "west";
        step *= -1;
      }
    } else if (dir === "south") {
      const maxY = basis.geometry.maxY;
      const southernNeighbor = this.windows
        .getVisibleTiles(srf)
        .filter((tile) => tile.geometry.y >= maxY);
      if (southernNeighbor.length === 0) {
        dir = "north";
        step *= -1;
      }
    }

    // TODO: configurable step size?
    const hStepSize = srf.workingArea.width * 0.03;
    const vStepSize = srf.workingArea.height * 0.03;
    let delta: RectDelta;
    switch (dir) {
      case "east":
        delta = new RectDelta(hStepSize * step, 0, 0, 0);
        break;
      case "west":
        delta = new RectDelta(0, hStepSize * step, 0, 0);
        break;
      case "south":
        delta = new RectDelta(0, 0, vStepSize * step, 0);
        break;
      case "north": /* passthru */
      default:
        delta = new RectDelta(0, 0, 0, vStepSize * step);
        break;
    }

    const layout = this.layouts.getCurrentLayout(srf);
    if (layout.adjust) {
      const area = srf.workingArea.gap(
        gaps.left,
        gaps.right,
        gaps.top,
        gaps.bottom
      );
      layout.adjust(
        area,
        this.windows.getVisibleTileables(srf),
        basis,
        delta,
        gaps.between
      );
    }
  }

  /**
   * Resize the given window, by moving border inward or outward.
   *
   * The actual behavior depends on the state of the given window.
   *
   * @param dir which border
   * @param step which direction. 1 means outward, -1 means inward.
   */
  public resizeWindow(
    window: WindowClass,
    dir: "east" | "west" | "south" | "north",
    step: -1 | 1
  ) {
    const state = window.state;
    if (WindowClass.isFloatingState(state)) this.resizeFloat(window, dir, step);
    else if (WindowClass.isTiledState(state))
      this.resizeTile(window, dir, step);
  }

  /**
   * Arrange tiles on all screens.
   */
  public arrange(ctx: IDriverContext) {
    ctx.screens.forEach((srf: ISurface) => {
      this.arrangeScreen(ctx, srf);
    });
  }

  /**
   * Arrange tiles on a screen.
   */
  public arrangeScreen(ctx: IDriverContext, srf: ISurface) {
    const layout = this.layouts.getCurrentLayout(srf);

    const visibles = this.windows.getVisibleWindows(srf);
    LOG?.send(
      LogModules.arrangeScreen,
      "Begin",
      `output: ${srf.output}, layout: ${layout}, visibles number: ${visibles.length}`
    );
    const gaps = this.getGaps(srf);

    const workingArea = this.docks.render(
      srf,
      visibles,
      srf.workingArea.clone()
    );

    visibles.forEach((window) => {
      if (LOG?.isModuleOn(LogModules.arrangeScreen)) {
        let mes = "";
        visibles.forEach((tile) => {
          mes += `${tile}\n`;
        });
        LOG.print(LogModules.arrangeScreen, "visibles", mes);
      }

      if (window.state === WindowState.Undecided) {
        window.state =
          window.shouldFloat || CONFIG.floatDefault
            ? WindowState.Floating
            : WindowState.Tiled;
      }
    });

    let tileables = this.windows.getVisibleTileables(srf);

    let tilingArea: Rect;
    if (
      (CONFIG.monocleMaximize && layout instanceof MonocleLayout) ||
      (tileables.length === 1 && CONFIG.soleWindowNoGaps)
    )
      tilingArea = workingArea;
    else if (
      tileables.length === 1 &&
      ((CONFIG.soleWindowWidth < 100 && CONFIG.soleWindowWidth > 0) ||
        (CONFIG.soleWindowHeight < 100 && CONFIG.soleWindowHeight > 0))
    ) {
      const h_gap =
        (workingArea.height -
          workingArea.height * (CONFIG.soleWindowHeight / 100)) /
        2;
      const v_gap =
        (workingArea.width -
          workingArea.width * (CONFIG.soleWindowWidth / 100)) /
        2;
      tilingArea = workingArea.gap(v_gap, v_gap, h_gap, h_gap);
    } else
      tilingArea = workingArea.gap(
        gaps.left,
        gaps.right,
        gaps.top,
        gaps.bottom
      );

    let tileablesLen = tileables.length;
    if (tileablesLen > 0) {
      let engineCtx = new EngineContext(ctx, this);
      layoutApply();
      if (CONFIG.unfitGreater || CONFIG.unfitLess) {
        tileables = tileables.filter((tile) => {
          if (
            (CONFIG.unfitGreater &&
              (tile.minSize.height > tile.geometry.height ||
                tile.minSize.width > tile.geometry.width)) ||
            (CONFIG.unfitLess &&
              (tile.maxSize.height < tile.geometry.height ||
                tile.maxSize.width < tile.geometry.width))
          ) {
            LOG?.send(
              LogModules.arrangeScreen,
              "unfitWindow",
              `id: ${tile.id} commitGeometry:${tile.geometry}. minSize:${
                tile.minSize.width
              }:${tile.minSize.height} - heightUnfit:${
                tile.minSize.height > tile.geometry.height
              } widthUnfit: ${
                tile.minSize.width > tile.geometry.width
              }, tile.maxSize:${tile.maxSize.width}:${
                tile.maxSize.height
              } heightUnfit: ${
                tile.maxSize.height < tile.geometry.height
              }, widthUnfit: ${tile.maxSize.width < tile.geometry.width}`
            );
            tile.state = WindowState.Floating;
            return false;
          } else {
            return true;
          }
        });
        if (tileables.length !== tileablesLen) {
          layoutApply();
        }
      }
      function layoutApply() {
        layout.apply(engineCtx, tileables, tilingArea, gaps.between);
        if (LOG?.isModuleOn(LogModules.arrangeScreen)) {
          let mes = "";
          tileables.forEach((tile) => {
            mes += `${tile.id}, state:${windowStateStr(
              tile.state
            )}, commitGeometry:${tile.geometry}\n`;
          });
          LOG?.send(LogModules.arrangeScreen, "LayoutApply", mes);
        }
      }
    }

    if (CONFIG.limitTileWidthRatio > 0 && !(layout instanceof MonocleLayout)) {
      const maxWidth = Math.floor(
        workingArea.height * CONFIG.limitTileWidthRatio
      );
      tileables
        .filter((tile) => tile.tiled && tile.geometry.width > maxWidth)
        .forEach((tile) => {
          const g = tile.geometry;
          tile.geometry = new Rect(
            g.x + Math.floor((g.width - maxWidth) / 2),
            g.y,
            maxWidth,
            g.height
          );
        });
    }

    if (CONFIG.soleWindowNoBorders && tileables.length === 1) {
      visibles.forEach((window) => {
        if (window.state === WindowState.Tiled)
          window.commit(CONFIG.soleWindowNoBorders);
        else window.commit();
      });
    } else {
      visibles.forEach((window) => window.commit());
    }
    LOG?.send(LogModules.arrangeScreen, "Finished", `${srf}`);
  }

  /**
   * Re-apply window geometry, computed by layout algorithm.
   *
   * Sometimes applications move or resize windows without user intervention,
   * which is straigh against the purpose of tiling WM. This operation
   * move/resize such windows back to where/how they should be.
   */
  public enforceSize(ctx: IDriverContext, window: WindowClass) {
    if (window.tiled && !window.actualGeometry.equals(window.geometry))
      ctx.setTimeout(() => {
        if (window.tiled) window.commit();
      }, 10);
  }

  /**
   * Register the given window to WM.
   */
  public manage(window: WindowClass) {
    if (!window.shouldIgnore) {
      if (this.docks.isNewWindowHaveDocked(window)) {
        window.state = WindowState.Docked;
      } else window.state = WindowState.Undecided;
      /* engine#arrange will update the state when required. */
      if (CONFIG.newWindowPosition === 1) this.windows.unshift(window);
      else if (CONFIG.newWindowPosition === 2) {
        this.windows.beside_first(window);
      } else this.windows.push(window);
    }
  }

  /**
   * Unregister the given window from WM.
   */
  public unmanage(window: WindowClass) {
    if (window.state === WindowState.Docked) {
      this.docks.remove(window);
    }
    this.windows.remove(window);
  }

  /**
   * Focus the next or previous window.
   */
  public focusOrder(ctx: IDriverContext, step: -1 | 1) {
    const window = ctx.currentWindow;

    /* if no current window, select the first tile. */
    if (window === null) {
      const tiles = this.windows.getVisibleTiles(ctx.currentSurface);
      if (tiles.length > 1) ctx.currentWindow = tiles[0];
      return;
    }

    const visibles = this.windows.getVisibleWindows(ctx.currentSurface);
    if (visibles.length === 0) /* nothing to focus */ return;

    const idx = visibles.indexOf(window);
    if (!window || idx < 0) {
      /* unmanaged window -> focus master */
      ctx.currentWindow = visibles[0];
      return;
    }

    const num = visibles.length;
    const newIndex = (idx + (step % num) + num) % num;

    ctx.currentWindow = visibles[newIndex];
  }

  /**
   * Focus a neighbor at the given direction.
   */
  public focusDir(ctx: IDriverContext, dir: Direction) {
    const window = ctx.currentWindow;

    /* if no current window, select the first tile. */
    if (window === null) {
      const tiles = this.windows.getVisibleTiles(ctx.currentSurface);
      if (tiles.length > 1) ctx.currentWindow = tiles[0];
      return;
    }

    const neighbor = this.getNeighborByDirection(ctx, window, dir);
    if (neighbor) ctx.currentWindow = neighbor;
  }

  /**
   * Swap the position of the current window with the next or previous window.
   */
  public swapOrder(window: WindowClass, step: -1 | 1) {
    const srf = window.surface;
    const visibles = this.windows.getVisibleWindows(srf);
    if (visibles.length < 2) return;

    const vsrc = visibles.indexOf(window);
    const vdst = wrapIndex(vsrc + step, visibles.length);
    const dstWin = visibles[vdst];

    this.windows.move(window, dstWin);
  }

  /**
   * Swap the position of the current window with a neighbor at the given direction.
   */
  public swapDirection(ctx: IDriverContext, dir: Direction) {
    const window = ctx.currentWindow;
    if (window === null) {
      /* if no current window, select the first tile. */
      const tiles = this.windows.getVisibleTiles(ctx.currentSurface);
      if (tiles.length > 1) ctx.currentWindow = tiles[0];
      return;
    }

    const neighbor = this.getNeighborByDirection(ctx, window, dir);
    if (neighbor) {
      this.windows.swap(window, neighbor)
    } else {
        switch (dir) {
          case "up":
            ctx.workspace.slotWindowToAboveScreen();
            break;
          case "down":
            ctx.workspace.slotWindowToBelowScreen();
            break;
          case "left":
            ctx.workspace.slotWindowToPrevScreen();
            break;
          case "right":
            ctx.workspace.slotWindowToNextScreen();
            break;
      }
      window.state = WindowState.Tiled;
    }
  }

  /**
   * Move the given window towards the given direction by one step.
   * @param window a floating window
   * @param dir which direction
   */
  public moveFloat(window: WindowClass, dir: Direction) {
    const srf = window.surface;

    // TODO: configurable step size?
    const hStepSize = srf.workingArea.width * 0.05;
    const vStepSize = srf.workingArea.height * 0.05;

    let hStep, vStep;
    switch (dir) {
      case "up":
        (hStep = 0), (vStep = -1);
        break;
      case "down":
        (hStep = 0), (vStep = 1);
        break;
      case "left":
        (hStep = -1), (vStep = 0);
        break;
      case "right":
        (hStep = 1), (vStep = 0);
        break;
    }

    const geometry = window.actualGeometry;
    const x = geometry.x + hStepSize * hStep;
    const y = geometry.y + vStepSize * vStep;

    window.forceSetGeometry(new Rect(x, y, geometry.width, geometry.height));
  }

  public swapDirOrMoveFloat(ctx: IDriverContext, dir: Direction) {
    const window = ctx.currentWindow;
    if (!window) return;

    const state = window.state;
    if (WindowClass.isFloatingState(state)) this.moveFloat(window, dir);
    else if (WindowClass.isTiledState(state)) this.swapDirection(ctx, dir);
  }

  public toggleDock(window: WindowClass) {
    window.state =
      window.state !== WindowState.Docked
        ? WindowState.Docked
        : WindowState.Tiled;
  }

  /**
   * Toggle float mode of window.
   */
  public toggleFloat(window: WindowClass) {
    window.state = !window.tileable ? WindowState.Tiled : WindowState.Floating;
  }

  /**
   * Toggle float on all windows on the given surface.
   *
   * The behaviours of this operation depends on the number of floating
   * windows: windows will be tiled if more than half are floating, and will
   * be floated otherwise.
   */
  public floatAll(ctx: IDriverContext, srf: ISurface) {
    const windows = this.windows.getVisibleWindows(srf);
    const numFloats = windows.reduce<number>((count, window) => {
      return window.state === WindowState.Floating ? count + 1 : count;
    }, 0);

    if (numFloats < windows.length / 2) {
      windows.forEach((window) => {
        /* TODO: do not use arbitrary constants */
        window.floatGeometry = window.actualGeometry.gap(4, 4, 4, 4);
        window.state = WindowState.Floating;
      });
      ctx.showNotification("Float All");
    } else {
      windows.forEach((window) => {
        window.state = WindowState.Tiled;
      });
      ctx.showNotification("Tile All");
    }
  }

  /**
   * Set the current window as the "master".
   *
   * The "master" window is simply the first window in the window list.
   * Some layouts depend on this assumption, and will make such windows more
   * visible than others.
   */
  public setMaster(window: WindowClass) {
    this.windows.setMaster(window);
  }

  /**
   * Change the layout of the current surface to the next.
   */
  public cycleLayout(ctx: IDriverContext, step: 1 | -1) {
    const layout = this.layouts.cycleLayout(ctx.currentSurface, step);
    if (layout) ctx.showNotification(layout.description);
  }

  /**
   * Set the layout of the current surface to the specified layout.
   */
  public setLayout(ctx: IDriverContext, layoutClassID: string) {
    const layout = this.layouts.setLayout(ctx.currentSurface, layoutClassID);
    if (layout) ctx.showNotification(layout.description);
  }

  /**
   * Let the current layout override shortcut.
   *
   * @returns True if the layout overrides the shortcut. False, otherwise.
   */
  public handleLayoutShortcut(
    ctx: IDriverContext,
    input: Shortcut,
    data?: any
  ): boolean {
    const layout = this.layouts.getCurrentLayout(ctx.currentSurface);
    if (layout.handleShortcut)
      return layout.handleShortcut(new EngineContext(ctx, this), input, data);
    return false;
  }
  /**
   * Let the docked window override shortcut.
   *
   * @returns True if the layout overrides the shortcut. False, otherwise.
   */
  public handleDockShortcut(
    ctx: IDriverContext,
    window: WindowClass,
    input: Shortcut
  ): boolean {
    return this.docks.handleShortcut(ctx, window, input);
  }

  private getNeighborByDirection(
    ctx: IDriverContext,
    basis: WindowClass,
    dir: Direction
  ): WindowClass | null {
    let vertical: boolean;
    let sign: -1 | 1;
    switch (dir) {
      case "up":
        vertical = true;
        sign = -1;
        break;
      case "down":
        vertical = true;
        sign = 1;
        break;
      case "left":
        vertical = false;
        sign = -1;
        break;
      case "right":
        vertical = false;
        sign = 1;
        break;
      default:
        return null;
    }

    const candidates = this.windows
      .getVisibleTiles(ctx.currentSurface)
      .filter(
        vertical
          ? (tile) => tile.geometry.y * sign > basis.geometry.y * sign
          : (tile) => tile.geometry.x * sign > basis.geometry.x * sign
      )
      .filter(
        vertical
          ? (tile) =>
              overlap(
                basis.geometry.x,
                basis.geometry.maxX,
                tile.geometry.x,
                tile.geometry.maxX
              )
          : (tile) =>
              overlap(
                basis.geometry.y,
                basis.geometry.maxY,
                tile.geometry.y,
                tile.geometry.maxY
              )
      );
    if (candidates.length === 0) return null;

    const min =
      sign *
      candidates.reduce(
        vertical
          ? (prevMin, tile): number => Math.min(tile.geometry.y * sign, prevMin)
          : (prevMin, tile): number =>
              Math.min(tile.geometry.x * sign, prevMin),
        Infinity
      );

    const closest = candidates.filter(
      vertical
        ? (tile) => tile.geometry.y === min
        : (tile) => tile.geometry.x === min
    );

    return closest.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  private getGaps(srf: ISurface): IGaps {
    if (this._defaultGaps === null) {
      this._defaultGaps = DefaultGapsCfg.instance;
      this._gapsSurfacesCfg = gapsSurfaceCfg.parseGapsUserSurfacesCfg();
    }
    const surfaceCfg = this._gapsSurfacesCfg.find((surfaceCfg) =>
      surfaceCfg.isFit(srf)
    );
    if (surfaceCfg === undefined) return this._defaultGaps;
    return surfaceCfg.cfg;
  }
}
