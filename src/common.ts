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

type percentType = number;

enum Shortcut {
  FocusNext,
  FocusPrev,
  DWMLeft,
  DWMRight,

  // Left,
  // Right,
  // Up,
  // Down,

  /* Alternate HJKL bindings */
  FocusUp,
  FocusDown,
  FocusLeft,
  FocusRight,

  ShiftLeft,
  ShiftRight,
  ShiftUp,
  ShiftDown,

  SwapUp,
  SwapDown,
  SwapLeft,
  SwapRight,

  GrowWidth,
  GrowHeight,
  ShrinkWidth,
  ShrinkHeight,

  Increase,
  Decrease,
  ShiftIncrease,
  ShiftDecrease,

  ToggleFloat,
  ToggleFloatAll,
  SetMaster,
  NextLayout,
  PreviousLayout,
  SetLayout,

  Rotate,
  RotatePart,
}

interface IShortcuts {
  getFocusNext(): ShortcutHandler;
  getFocusPrev(): ShortcutHandler;

  getFocusUp(): ShortcutHandler;
  getFocusDown(): ShortcutHandler;
  getFocusLeft(): ShortcutHandler;
  getFocusRight(): ShortcutHandler;

  getShiftDown(): ShortcutHandler;
  getShiftUp(): ShortcutHandler;
  getShiftLeft(): ShortcutHandler;
  getShiftRight(): ShortcutHandler;

  getGrowHeight(): ShortcutHandler;
  getShrinkHeight(): ShortcutHandler;
  getShrinkWidth(): ShortcutHandler;
  getGrowWidth(): ShortcutHandler;

  getIncrease(): ShortcutHandler;
  getDecrease(): ShortcutHandler;

  getToggleFloat(): ShortcutHandler;
  getFloatAll(): ShortcutHandler;
  getNextLayout(): ShortcutHandler;
  getPreviousLayout(): ShortcutHandler;

  getRotate(): ShortcutHandler;
  getRotatePart(): ShortcutHandler;

  getSetMaster(): ShortcutHandler;

  getTileLayout(): ShortcutHandler;
  getMonocleLayout(): ShortcutHandler;
  getThreeColumnLayout(): ShortcutHandler;
  getThreeColumnAltLayout(): ShortcutHandler;
  getSpreadLayout(): ShortcutHandler;
  getStairLayout(): ShortcutHandler;
  getFloatingLayout(): ShortcutHandler;
  getQuarterLayout(): ShortcutHandler;
  getStackedLayout(): ShortcutHandler;
  getColumnsLayout(): ShortcutHandler;
  getSpiralLayout(): ShortcutHandler;
  getBTreeLayout(): ShortcutHandler;
}

//#region Driver

interface IConfig {
  //#region Layout
  layoutOrder: string[];
  layoutFactories: { [key: string]: () => ILayout };
  tileLayoutInitialAngle: string;
  columnsLayoutInitialAngle: string;
  columnsBalanced: boolean;
  columnsLayerConf: string[];
  monocleMaximize: boolean;
  soleWindowWidth: number;
  soleWindowHeight: number;
  //#endregion

  //#region Features
  adjustLayout: boolean;
  adjustLayoutLive: boolean;
  floatedWindowsLayer: WindowLayer;
  tiledWindowsLayer: WindowLayer;
  keepTilingOnDrag: boolean;
  noTileBorder: boolean;
  limitTileWidthRatio: number;
  //#endregion

  //#region Gap
  screenGapBottom: number;
  screenGapLeft: number;
  screenGapRight: number;
  screenGapTop: number;
  tileLayoutGap: number;
  //#endregion

  //#region Behavior
  directionalKeyMode: "dwm" | "focus";
  newWindowPosition: number;
  //#endregion
  screenDefaultLayout: string[];
}

interface IDriverWindow {
  readonly fullScreen: boolean;
  readonly geometry: Readonly<Rect>;
  readonly id: string;
  readonly maximized: boolean;
  readonly minimized: boolean;
  readonly shouldIgnore: boolean;
  readonly shouldFloat: boolean;

  surface: ISurface;

  commit(geometry?: Rect, noBorder?: boolean, windowLayer?: WindowLayer): void;
  visible(srf: ISurface): boolean;
}

interface ISurface {
  readonly id: string;
  readonly ignore: boolean;
  readonly workingArea: Readonly<Rect>;

  next(): ISurface | null;
}

interface IDriverContext {
  readonly backend: string;
  readonly screens: ISurface[];
  readonly cursorPosition: [number, number] | null;

  currentSurface: ISurface;
  currentWindow: WindowClass | null;

  setTimeout(func: () => void, timeout: number): void;
  showNotification(text: string): void;
}

//#endregion

interface ILayoutClass {
  readonly id: string;
  new (): ILayout;
}

interface ILayout {
  /* read-only */
  readonly capacity?: number;
  readonly description: string;

  /* methods */
  adjust?(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta
  ): void;
  apply(ctx: EngineContext, tileables: WindowClass[], area: Rect): void;
  handleShortcut?(ctx: EngineContext, input: Shortcut, data?: any): boolean;
  drag?(
    ctx: EngineContext,
    draggingRect: Rect,
    window: WindowClass,
    workingArea: Rect
  ): boolean;

  toString(): string;
}

let CONFIG: IConfig;
