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

const Shortcut = {
  FocusNext: 1,
  FocusPrev: 2,
  DWMLeft: 3,
  DWMRight: 4,

  // Left,
  // Right,
  // Up,
  // Down,

  /* Alternate HJKL bindings */
  FocusUp: 5,
  FocusDown: 6,
  FocusLeft: 7,
  FocusRight: 8,

  ShiftLeft: 9,
  ShiftRight: 10,
  ShiftUp: 11,
  ShiftDown: 12,

  SwapUp: 13,
  SwapDown: 14,
  SwapLeft: 15,
  SwapRight: 16,

  GrowWidth: 17,
  GrowHeight: 18,
  ShrinkWidth: 19,
  ShrinkHeight: 20,

  Increase: 21,
  Decrease: 22,
  ShiftIncrease: 22,
  ShiftDecrease: 23,

  ToggleFloat: 24,
  ToggleFloatAll: 25,
  SetMaster: 26,
  NextLayout: 27,
  PreviousLayout: 28,
  SetLayout: 29,

  Rotate: 30,
  RotatePart: 31,

  ToggleDock: 32,
} as const;
type Shortcut = (typeof Shortcut)[keyof typeof Shortcut];

interface IShortcuts {
  getToggleDock(): ShortcutHandler;

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
  // dock parameters
  dockOrder: [number, number, number, number];
  dockHHeight: number;
  dockHWide: number;
  dockHGap: number;
  dockHEdgeGap: number;
  dockHAlignment: number;
  dockHEdgeAlignment: number;
  dockVHeight: number;
  dockVWide: number;
  dockVGap: number;
  dockVEdgeGap: number;
  dockVAlignment: number;
  dockVEdgeAlignment: number;
  dockSurfacesConfig: string[];
  dockWindowClassConfig: string[];

  //#region Layout
  layoutOrder: string[];
  layoutFactories: { [key: string]: () => ILayout };
  tileLayoutInitialAngle: string;
  quarterLayoutReset: boolean;
  columnsLayoutInitialAngle: string;
  columnsBalanced: boolean;
  columnsLayerConf: string[];
  monocleMaximize: boolean;
  soleWindowWidth: number;
  soleWindowHeight: number;
  soleWindowNoBorders: boolean;
  soleWindowNoGaps: boolean;
  //#endregion

  //#region Features
  adjustLayout: boolean;
  adjustLayoutLive: boolean;
  floatedWindowsLayer: WindowLayer;
  tiledWindowsLayer: WindowLayer;
  keepTilingOnDrag: boolean;
  noTileBorder: boolean;
  notificationDuration: number;
  limitTileWidthRatio: number;
  //#endregion

  //#region Gap
  screenGapBottom: number;
  screenGapLeft: number;
  screenGapRight: number;
  screenGapTop: number;
  screenGapBetween: number;
  gapsOverrideConfig: string[];
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
  readonly windowClassName: string;
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

  readonly output: Output;
  readonly activity: string;
  readonly desktop: VirtualDesktop;

  next(): ISurface | null;
  getParams(): [string, string, string];
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
    delta: RectDelta,
    gap: number
  ): void;
  apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void;
  handleShortcut?(ctx: EngineContext, input: Shortcut, data?: any): boolean;
  drag?(
    ctx: EngineContext,
    draggingRect: Rect,
    window: WindowClass,
    workingArea: Rect
  ): boolean;

  toString(): string;
}

interface IGaps {
  left: number;
  right: number;
  top: number;
  bottom: number;
  between: number;
}

let CONFIG: IConfig;
