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

class WindowClass {
  public static isTileableState(state: WindowState): boolean {
    return (
      state === WindowState.Dragging ||
      state === WindowState.Tiled ||
      state === WindowState.Maximized ||
      state === WindowState.TiledAfloat
    );
  }

  public static isTiledState(state: WindowState): boolean {
    return state === WindowState.Tiled || state === WindowState.Maximized;
  }

  public static isFloatingState(state: WindowState): boolean {
    return state === WindowState.Floating || state === WindowState.TiledAfloat;
  }

  public readonly id: string;
  public readonly window: IDriverWindow;

  public get actualGeometry(): Readonly<Rect> {
    return this.window.geometry;
  }
  public get shouldFloat(): boolean {
    return this.window.shouldFloat;
  }
  public get shouldIgnore(): boolean {
    return this.window.shouldIgnore;
  }

  /** If this window ***can be*** tiled by layout. */
  public get tileable(): boolean {
    return WindowClass.isTileableState(this.state);
  }
  /** If this window is ***already*** tiled, thus a part of the current layout. */
  public get tiled(): boolean {
    return WindowClass.isTiledState(this.state);
  }
  /** If this window is floating, thus its geometry is not tightly managed. */
  public get floating(): boolean {
    return WindowClass.isFloatingState(this.state);
  }

  public get geometryDelta(): RectDelta | null {
    if (this.geometry === this.actualGeometry) return null;

    return RectDelta.fromRects(this.geometry, this.actualGeometry);
  }

  public get minSize() {
    return this._minSize;
  }
  public get maxSize() {
    return this._maxSize;
  }

  /**
   * The current state of the window.
   *
   * This value affects what and how properties gets commited to the backend.
   *
   * Avoid comparing this value directly, and use `tileable`, `tiled`,
   * `floating` as much as possible.
   */
  public get state(): WindowState {
    /* external states override the internal state. */
    if (this.window.fullScreen) return WindowState.NativeFullscreen;
    if (this.window.maximized) return WindowState.NativeMaximized;

    return this.internalState;
  }

  public set state(value: WindowState) {
    const state = this.state;

    /* cannot transit to the current state */
    if (state === value || state === WindowState.Dragging) return;

    if (
      (state === WindowState.Unmanaged || WindowClass.isTileableState(state)) &&
      WindowClass.isFloatingState(value)
    )
      this.shouldCommitFloat = true;
    else if (
      WindowClass.isFloatingState(state) &&
      WindowClass.isTileableState(value)
    )
      /* save the current geometry before leaving floating state */
      this._floatGeometry = this.actualGeometry;

    this.internalState = value;
  }
  public setDraggingState() {
    this.internalState = WindowState.Dragging;
  }
  public setState(value: WindowState) {
    this.internalState = value;
  }

  public get surface(): ISurface {
    return this.window.surface;
  }

  public set surface(srf: ISurface) {
    this.window.surface = srf;
  }

  public get weight(): number {
    const srfID = this.window.surface.id;
    const weight: number | undefined = this.weightMap[srfID];
    if (weight === undefined) {
      this.weightMap[srfID] = 1.0;
      return 1.0;
    }
    return weight;
  }

  public set weight(value: number) {
    const srfID = this.window.surface.id;
    this.weightMap[srfID] = value;
  }

  public get windowClassName(): string {
    return this.window.windowClassName;
  }

  public get floatGeometry(): Rect {
    if (this._floatGeometry === null) {
      this._floatGeometry = this.window.getInitFloatGeometry();
    }
    return this._floatGeometry;
  }
  public set floatGeometry(value: Rect) {
    this._floatGeometry = value;
  }

  public dock: Dock | null;
  public geometry: Rect;
  public timestamp: number;

  private internalState: WindowState;
  private shouldCommitFloat: boolean;
  private weightMap: { [key: string]: number };
  private _minSize: ISize;
  private _maxSize: ISize;
  private _floatGeometry: Rect | null;

  constructor(window: IDriverWindow) {
    this.id = window.id;
    this.window = window;

    this._floatGeometry = null;
    this.geometry = window.geometry;
    this.timestamp = 0;

    this.internalState = WindowState.Unmanaged;
    this.shouldCommitFloat = this.shouldFloat;
    this.weightMap = {};
    this.dock = null;

    this._minSize = window.minSize;
    this._maxSize = window.maxSize;
  }
  public toString(): string {
    return `Window: id=${this.id}, state: ${windowStateStr(this.state)}. ${
      this.window
    }`;
  }

  public commit(noBorders?: boolean) {
    const state = this.state;
    LOG?.send(
      LogModules.arrangeScreen,
      "commit",
      `id: ${this.id}, state: ${windowStateStr(state)}, floatGeometry: ${
        this.floatGeometry
      }, commitGeometry: ${this.geometry}, noBorders: ${noBorders}`
    );
    switch (state) {
      case WindowState.Dragging:
        break;
      case WindowState.NativeMaximized:
        this.window.commit(undefined, undefined, undefined);
        break;

      case WindowState.NativeFullscreen:
        this.window.commit(undefined, undefined, WindowLayer.Normal);
        break;

      case WindowState.Floating:
        if (!this.shouldCommitFloat) break;
        this.window.commit(
          this.floatGeometry,
          false,
          CONFIG.floatedWindowsLayer
        );
        this.shouldCommitFloat = false;
        break;

      case WindowState.Maximized:
        this.window.commit(this.geometry, true, WindowLayer.Normal);
        break;

      case WindowState.Tiled:
        this.window.commit(
          this.geometry,
          CONFIG.noTileBorder || Boolean(noBorders),
          CONFIG.tiledWindowsLayer
        );
        break;

      case WindowState.TiledAfloat:
        if (!this.shouldCommitFloat) break;
        this.window.commit(
          this.floatGeometry,
          false,
          CONFIG.floatedWindowsLayer
        );
        this.shouldCommitFloat = false;
        break;
      case WindowState.Floating:
        this.window.commit(
          this.geometry,
          CONFIG.noTileBorder || Boolean(noBorders),
          CONFIG.floatedWindowsLayer
        );
        break;
      case WindowState.Docked:
        this.window.commit(
          this.geometry,
          CONFIG.noTileBorder,
          CONFIG.tiledWindowsLayer
        );
        break;
    }
  }

  /**
   * Force apply the geometry *immediately*.
   *
   * This method is a quick hack created for engine#resizeFloat, thus should
   * not be used in other places.
   */
  public forceSetGeometry(geometry: Rect) {
    this.window.commit(geometry);
  }

  public visible(srf: ISurface): boolean {
    return this.window.visible(srf);
  }
  public get minimized(): boolean {
    return this.window.minimized;
  }
}
