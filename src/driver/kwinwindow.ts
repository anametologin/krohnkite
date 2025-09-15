/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class KWinWindow implements IDriverWindow {
  public static generateID(w: Window) {
    return w.internalId.toString();
  }

  public get fullScreen(): boolean {
    return this.window.fullScreen;
  }

  public get geometry(): Rect {
    return toRect(this.window.frameGeometry);
  }

  public get windowClassName(): string {
    return this.window.resourceClass;
  }

  public get shouldIgnore(): boolean {
    if (this.window.deleted) return true;
    return (
      this.window.specialWindow ||
      this.window.resourceClass === "plasmashell" ||
      this.isIgnoredByConfig
    );
  }

  public get shouldFloat(): boolean {
    return (
      this.isFloatByConfig ||
      (CONFIG.floatSkipPager && this.window.skipPager) ||
      this.window.modal ||
      this.window.transient ||
      !this.window.resizeable ||
      (KWINCONFIG.floatUtility &&
        (this.window.dialog || this.window.splash || this.window.utility))
    );
  }

  public maximized: boolean;
  public get minimized(): boolean {
    return this.window.minimized;
  }

  public get surface(): ISurface {
    let activity;
    let vDesktop;
    if (this.window.activities.length === 0)
      activity = this.workspace.currentActivity;
    else if (
      this.window.activities.indexOf(this.workspace.currentActivity) >= 0
    )
      activity = this.workspace.currentActivity;
    else activity = this.window.activities[0];

    if (this.window.desktops.length === 1) {
      vDesktop = this.window.desktops[0];
    } else if (this.window.desktops.length === 0) {
      vDesktop = this.workspace.currentDesktop;
    } else {
      if (this.window.desktops.indexOf(this.workspace.currentDesktop) >= 0)
        vDesktop = this.workspace.currentDesktop;
      else vDesktop = this.window.desktops[0];
    }

    return this._surfaceStore.getSurface(
      this.window.output,
      activity,
      vDesktop
    );
  }

  public set surface(srf: ISurface) {
    const ksrf = srf as KWinSurface;

    // TODO: setting activity?
    // TODO: setting screen = move to the screen
    if (this.window.desktops[0] !== ksrf.vDesktop)
      this.window.desktops = [ksrf.vDesktop];
    if (this.window.activities[0] !== ksrf.activity)
      this.window.activities = [ksrf.activity];
  }

  public get minSize(): ISize {
    return {
      width: this.window.minSize.width,
      height: this.window.minSize.height,
    };
  }
  public get maxSize(): ISize {
    return {
      width: this.window.maxSize.width,
      height: this.window.maxSize.height,
    };
  }
  public readonly window: Window;
  public readonly id: string;

  private readonly workspace: Workspace;
  private readonly isFloatByConfig: boolean;
  private readonly isIgnoredByConfig: boolean;
  private readonly _surfaceStore: KWinSurfaceStore;
  private noBorderManaged: boolean;
  private noBorderOriginal: boolean;

  constructor(
    window: Window,
    workspace: Workspace,
    surfaceStore: KWinSurfaceStore
  ) {
    this.workspace = workspace;
    this._surfaceStore = surfaceStore;
    this.window = window;
    this.id = KWinWindow.generateID(window);
    this.maximized = false;
    this.noBorderManaged = false;
    this.noBorderOriginal = window.noBorder;
    this.isIgnoredByConfig =
      KWinWindow.isContain(KWINCONFIG.ignoreClass, window.resourceClass) ||
      KWinWindow.isContain(KWINCONFIG.ignoreClass, window.resourceName) ||
      matchWords(this.window.caption, KWINCONFIG.ignoreTitle) >= 0 ||
      KWinWindow.isContain(KWINCONFIG.ignoreRole, window.windowRole) ||
      (KWINCONFIG.tileNothing &&
        KWinWindow.isContain(KWINCONFIG.tilingClass, window.resourceClass));
    this.isFloatByConfig =
      KWinWindow.isContain(KWINCONFIG.floatingClass, window.resourceClass) ||
      KWinWindow.isContain(KWINCONFIG.floatingClass, window.resourceName) ||
      matchWords(this.window.caption, KWINCONFIG.floatingTitle) >= 0;
  }

  public commit(
    geometry?: Rect,
    noBorder?: boolean,
    windowLayer?: WindowLayer
  ) {
    LOG?.send(
      LogModules.window,
      "KwinWindow#commit",
      `geometry:${geometry}, noBorder:${noBorder}, windowLayer:${windowLayer}`
    );
    if (this.window.move || this.window.resize) return;

    if (noBorder !== undefined) {
      if (!this.noBorderManaged && noBorder)
        /* Backup border state when transitioning from unmanaged to managed */
        this.noBorderOriginal = this.window.noBorder;
      else if (this.noBorderManaged && !this.window.noBorder)
        /* If border is enabled while in managed mode, remember it.
         * Note that there's no way to know if border is re-disabled in managed mode. */
        this.noBorderOriginal = false;

      if (noBorder)
        /* (Re)entering managed mode: remove border. */
        this.window.noBorder = true;
      else if (this.noBorderManaged)
        /* Exiting managed mode: restore original value. */
        this.window.noBorder = this.noBorderOriginal;

      /* update mode */
      this.noBorderManaged = noBorder;
    }

    if (windowLayer !== undefined) {
      if (windowLayer === WindowLayer.Above) this.window.keepAbove = true;
      else if (windowLayer === WindowLayer.Below) this.window.keepBelow = true;
      else if (windowLayer === WindowLayer.Normal) {
        this.window.keepAbove = false;
        this.window.keepBelow = false;
      }
    }

    if (geometry !== undefined) {
      geometry = this.adjustGeometry(geometry);
      if (KWINCONFIG.preventProtrusion) {
        const area = toRect(
          this.workspace.clientArea(
            ClientAreaOption.PlacementArea,
            this.window.output,
            this.workspace.currentDesktop
          )
        );
        if (!area.includes(geometry)) {
          /* assume windows will extrude only through right and bottom edges */
          const x = geometry.x + Math.min(area.maxX - geometry.maxX, 0);
          const y = geometry.y + Math.min(area.maxY - geometry.maxY, 0);
          geometry = new Rect(x, y, geometry.width, geometry.height);
          geometry = this.adjustGeometry(geometry);
        }
      }
      if (this.window.deleted) return;
      this.window.frameGeometry = toQRect(geometry);
    }
  }

  public toString(): string {
    return `${debugWin(this.window)}`;
  }

  public visible(srf: ISurface): boolean {
    const ksrf = srf as KWinSurface;
    return (
      !this.window.deleted &&
      !this.window.minimized &&
      (this.window.onAllDesktops ||
        this.window.desktops.indexOf(ksrf.vDesktop) !== -1) &&
      (this.window.activities.length === 0 /* on all activities */ ||
        this.window.activities.indexOf(ksrf.activity) !== -1) &&
      this.window.output === ksrf.output
    );
  }

  //#region Private Methods
  public static isContain(filterList: string[], s: string): boolean {
    for (let filterWord of filterList) {
      if (filterWord[0] === "[" && filterWord[filterWord.length - 1] === "]") {
        if (
          s
            .toLowerCase()
            .includes(filterWord.toLowerCase().slice(1, filterWord.length - 1))
        )
          return true;
      } else if (s.toLowerCase() === filterWord.toLowerCase()) return true;
    }
    return false;
  }
  /** apply various resize hints to the given geometry */
  private adjustGeometry(geometry: Rect): Rect {
    let width = geometry.width;
    let height = geometry.height;

    /* do not resize fixed-size windows */
    if (!this.window.resizeable) {
      width = this.window.width;
      height = this.window.height;
    } else {
      width = clip(width, this.window.minSize.width, this.window.maxSize.width);
      height = clip(
        height,
        this.window.minSize.height,
        this.window.maxSize.height
      );
    }

    return new Rect(geometry.x, geometry.y, width, height);
  }

  public getInitFloatGeometry(): Rect {
    let outputGeometry = this.window.output.geometry;
    let width, height, x, y: number;
    width = outputGeometry.width * (CONFIG.floatInitWindowWidth / 100);
    height = outputGeometry.height * (CONFIG.floatInitWindowHeight / 100);
    x = outputGeometry.x + outputGeometry.width / 2 - width / 2;
    y = outputGeometry.y + outputGeometry.height / 2 - height / 2;
    if (
      this.window.minSize.width > outputGeometry.width ||
      this.window.minSize.height > outputGeometry.height
    ) {
      width = this.window.minSize.width;
      height = this.window.minSize.height;
      x = outputGeometry.x;
      y = outputGeometry.y;
    } else if (
      !this.window.resizeable ||
      this.window.maxSize.width < width ||
      this.window.maxSize.height < height
    ) {
      width = this.window.maxSize.width;
      height = this.window.maxSize.height;
    } else {
      if (CONFIG.floatRandomize) {
        x =
          x +
          getRandomInt(
            (x - outputGeometry.x) * (CONFIG.floatRandomWidth / 100),
            true
          );
        y =
          y +
          getRandomInt(
            (y - outputGeometry.y) * (CONFIG.floatRandomHeight / 100),
            true
          );
      }
    }

    return new Rect(x, y, width, height);
  }
}
