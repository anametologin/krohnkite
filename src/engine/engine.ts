// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

type Direction = "up" | "down" | "left" | "right";
type ScreenData = {
  visibles: WindowClass[];
  tileables: WindowClass[];
  layout: ILayout;
  workingArea: Rect;
  srf: ISurface;
  capacity: number | null;
  overCapacity: WindowClass[];
  awaitToMove: WindowClass[];
};

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
  public arrange(ctx: IDriverContext, reason: string) {
    LOG?.send(
      LogModules.arrangeScreen,
      "ArrangeScreens",
      `###################################################Reason: ${reason}####################################`
    );
    const surfaces = ctx.currentSurfaces;
    let screensData: ScreenData[] = [];
    surfaces.forEach((srf) => {
      screensData.push(this.getTileables(srf));
    });
    if (CONFIG.surfacesIsMoveWindows && reason !== "moveWindowsToScreen") {
      let isMoving = false;
      screensData.forEach((screenData: ScreenData) => {
        if (screenData.overCapacity.length > 0) {
          for (let i = 0; i < screensData.length; i++) {
            let sd = screensData[i];
            if (sd.capacity === null) {
              sd.awaitToMove.push(
                ...screenData.overCapacity.splice(
                  0,
                  screenData.overCapacity.length
                )
              );
              isMoving = true;
            } else if (sd.capacity - sd.awaitToMove.length > 0) {
              const availableSlots = Math.min(
                sd.capacity - sd.awaitToMove.length,
                screenData.overCapacity.length
              );
              sd.awaitToMove.push(
                ...screenData.overCapacity.splice(0, availableSlots)
              );
              isMoving = true;
            }
            if (screenData.overCapacity.length === 0) {
              break;
            }
          }
        }
      });
      if (isMoving) {
        let moveTiles: [Output, WindowClass[]][] = [];
        screensData.forEach((screenData: ScreenData) => {
          if (screenData.awaitToMove.length > 0)
            moveTiles.push([screenData.srf.output, screenData.awaitToMove]);
        });
        ctx.moveWindowsToScreen(moveTiles);
        return;
      }
    }

    screensData.forEach((screenData: ScreenData) => {
      this.arrangeScreen(ctx, screenData);
    });
  }

  private getTileables(srf: ISurface): ScreenData {
    let visibles = this.windows.getVisibleWindows(srf);
    visibles.forEach((window) => {
      if (window.state === WindowState.Undecided) {
        window.state =
          window.shouldFloat || CONFIG.floatDefault
            ? WindowState.Floating
            : WindowState.Tiled;
      }
    });
    if (LOG?.isModuleOn(LogModules.arrangeScreen)) {
      let mes = "";
      visibles.forEach((tile) => {
        mes += `${tile}\n`;
      });
      LOG.print(LogModules.arrangeScreen, "visibles", mes);
    }
    let tileables = this.windows.getVisibleTileables(srf);
    let layout = this.layouts.getCurrentLayout(srf);

    let capacity: number | null;
    let layoutCap = layout.capacity === undefined ? null : layout.capacity;
    if (layoutCap === null && srf.capacity === null) {
      capacity = null;
    } else if (layoutCap === null || srf.capacity === null) {
      capacity = layoutCap || srf.capacity;
    } else {
      capacity = Math.min(layoutCap, srf.capacity);
    }
    let overCapacity: WindowClass[];
    if (capacity !== null && tileables.length > capacity) {
      if (!CONFIG.surfacesIsMoveOldestWindows) {
        overCapacity = tileables.splice(capacity - tileables.length);
      } else {
        overCapacity = tileables.splice(0, tileables.length - capacity);
      }
      capacity = 0;
    } else {
      overCapacity = [];
      capacity = capacity === null ? null : capacity - tileables.length;
    }
    let screenData = {
      visibles: visibles,
      tileables: tileables,
      layout: layout,
      workingArea: this.docks.render(srf, visibles, srf.workingArea.clone()),
      srf: srf,
      overCapacity: overCapacity,
      capacity: capacity,
      awaitToMove: [],
    };

    LOG?.send(
      LogModules.arrangeScreen,
      "getTileablesReturn",
      `output: ${srf.output.name}\n visibles number: ${
        visibles.length
      }\n tileables.length: ${screenData.tileables.length}, workingArea: ${
        screenData.workingArea
      }, layout: ${
        screenData.layout
      },capacity: ${capacity}, overCapacity: ${screenData.overCapacity.map(
        (win) => win.window.windowClassName
      )}`
    );
    return screenData;
  }

  /**
   * Arrange tiles on a screen.
   */
  public arrangeScreen(ctx: IDriverContext, screenData: ScreenData) {
    LOG?.send(
      LogModules.arrangeScreen,
      "arrangeScreen",
      `output: ${screenData.srf.output.name}`
    );
    screenData.overCapacity.forEach((win) => {
      win.state = WindowState.Floating;
    });
    const gaps = this.getGaps(screenData.srf);

    let tilingArea: Rect;
    if (
      (CONFIG.monocleMaximize && screenData.layout instanceof MonocleLayout) ||
      (screenData.tileables.length === 1 && CONFIG.soleWindowNoGaps)
    )
      tilingArea = screenData.workingArea;
    else if (
      screenData.tileables.length === 1 &&
      ((CONFIG.soleWindowWidth < 100 && CONFIG.soleWindowWidth > 0) ||
        (CONFIG.soleWindowHeight < 100 && CONFIG.soleWindowHeight > 0))
    ) {
      const h_gap =
        (screenData.workingArea.height -
          screenData.workingArea.height * (CONFIG.soleWindowHeight / 100)) /
        2;
      const v_gap =
        (screenData.workingArea.width -
          screenData.workingArea.width * (CONFIG.soleWindowWidth / 100)) /
        2;
      tilingArea = screenData.workingArea.gap(v_gap, v_gap, h_gap, h_gap);
    } else
      tilingArea = screenData.workingArea.gap(
        gaps.left,
        gaps.right,
        gaps.top,
        gaps.bottom
      );

    let tileablesLen = screenData.tileables.length;
    if (tileablesLen > 0) {
      let engineCtx = new EngineContext(ctx, this);
      function layoutApply() {
        screenData.layout.apply(
          engineCtx,
          screenData.tileables,
          tilingArea,
          gaps.between
        );
        if (LOG?.isModuleOn(LogModules.arrangeScreen)) {
          let mes = "";
          screenData.tileables.forEach((tile) => {
            mes += `${tile.id}, state:${windowStateStr(
              tile.state
            )}, commitGeometry:${tile.geometry}\n`;
          });
          LOG?.send(LogModules.arrangeScreen, "LayoutApply", mes);
        }
      }
      function getNumberTileablesGreaterThenMin(
        tileables: WindowClass[]
      ): number {
        let numberOfTiles = 0;
        tileables.forEach((tile) => {
          if (
            tile.minSize.height > tile.geometry.height ||
            tile.minSize.width > tile.geometry.width
          ) {
            numberOfTiles++;
          }
        });
        return numberOfTiles;
      }
      layoutApply();
      if (CONFIG.unfitGreater || CONFIG.unfitLess) {
        let unfitGreaterQuantity = 0;
        screenData.tileables = screenData.tileables.filter((tile) => {
          if (
            CONFIG.unfitLess &&
            (tile.maxSize.height < tile.geometry.height ||
              tile.maxSize.width < tile.geometry.width)
          ) {
            LOG?.send(
              LogModules.arrangeScreen,
              "unfitLess",
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
          } else if (
            CONFIG.unfitGreater &&
            (tile.minSize.height > tile.geometry.height ||
              tile.minSize.width > tile.geometry.width)
          ) {
            unfitGreaterQuantity += 1;
            return true;
          } else {
            return true;
          }
        });
        if (screenData.tileables.length !== tileablesLen) {
          layoutApply();
        }
        if (unfitGreaterQuantity > 0) {
          LOG?.send(
            LogModules.arrangeScreen,
            "UnfitGreater",
            `unfitGreaterQuantity: ${unfitGreaterQuantity}`
          );
          if (screenData.tileables.length !== tileablesLen) {
            unfitGreaterQuantity = getNumberTileablesGreaterThenMin(
              screenData.tileables
            );
          }
          while (screenData.tileables.length > 0 && unfitGreaterQuantity > 0) {
            let tile = screenData.tileables.shift();
            tile!.state = WindowState.Floating;
            layoutApply();
            unfitGreaterQuantity = getNumberTileablesGreaterThenMin(
              screenData.tileables
            );
          }
        }
      }
    }

    if (
      CONFIG.limitTileWidthRatio > 0 &&
      !(screenData.layout instanceof MonocleLayout)
    ) {
      const maxWidth = Math.floor(
        screenData.workingArea.height * CONFIG.limitTileWidthRatio
      );
      screenData.tileables
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

    if (CONFIG.soleWindowNoBorders && screenData.tileables.length === 1) {
      screenData.visibles.forEach((window) => {
        if (window.state === WindowState.Tiled)
          window.commit(CONFIG.soleWindowNoBorders);
        else window.commit();
      });
    } else {
      screenData.visibles.forEach((window) => window.commit());
    }
    LOG?.send(
      LogModules.arrangeScreen,
      "#######################################################Finished",
      `${screenData.srf}`
    );
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
  public swapDirection(ctx: IDriverContext, dir: Direction): boolean {
    const window = ctx.currentWindow;
    if (window === null) {
      /* if no current window, select the first tile. */
      const tiles = this.windows.getVisibleTiles(ctx.currentSurface);
      if (tiles.length > 1) ctx.currentWindow = tiles[0];
      return false;
    }

    const neighbor = this.getNeighborByDirection(ctx, window, dir);
    if (neighbor) {
      this.windows.swap(window, neighbor);
    } else {
      switch (dir) {
        case "up":
          ctx.moveToScreen(window, "up");
          break;
        case "down":
          ctx.moveToScreen(window, "down");
          break;
        case "left":
          ctx.moveToScreen(window, "left");
          break;
        case "right":
          ctx.moveToScreen(window, "right");
          break;
      }
      return false;
    }
    return true;
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

  public swapDirOrMoveFloat(ctx: IDriverContext, dir: Direction): boolean {
    const window = ctx.currentWindow;
    if (!window) return false;

    const state = window.state;
    if (WindowClass.isFloatingState(state)) this.moveFloat(window, dir);
    else if (WindowClass.isTiledState(state)) {
      return this.swapDirection(ctx, dir);
    }
    return true;
  }

  public toggleDock(window: WindowClass) {
    window.state =
      window.state !== WindowState.Docked
        ? WindowState.Docked
        : WindowState.Tiled;
  }

  public raiseSurfaceCapacity(ctx: IDriverContext): number | null {
    const currentSurface = ctx.currentSurface;
    if (currentSurface.capacity !== null) {
      currentSurface.capacity =
        currentSurface.capacity < 98 ? currentSurface.capacity + 1 : null;
    } else {
      let tileables = this.windows.getVisibleTileables(currentSurface);
      currentSurface.capacity =
        tileables.length < 98 ? tileables.length + 1 : null;
    }
    return currentSurface.capacity;
  }
  public lowerSurfaceCapacity(ctx: IDriverContext): number | null {
    const currentSurface = ctx.currentSurface;
    if (currentSurface.capacity !== null) {
      currentSurface.capacity =
        currentSurface.capacity > 0 ? currentSurface.capacity - 1 : 0;
    } else {
      let tileables = this.windows.getVisibleTileables(currentSurface);
      currentSurface.capacity = tileables.length > 0 ? tileables.length - 1 : 0;
    }
    return currentSurface.capacity;
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

    if (numFloats === 0) {
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
