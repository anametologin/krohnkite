/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

type percentType = number;
type Direction = "up" | "down" | "left" | "right";
type Position = "left" | "middle" | "right" | "upper" | "bottom" | "single";
function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case "right":
      return "left";
    case "left":
      return "right";
    case "up":
      return "down";
    case "down":
      return "up";
  }
}

const WindowState = {
  /* initial value */
  Unmanaged: 1,

  /* script-external state - overrides internal state */
  NativeFullscreen: 2,
  NativeMaximized: 3,

  /* script-internal state */
  Floating: 4,
  Maximized: 5,
  Tiled: 6,
  TiledAfloat: 7,
  Undecided: 8,
  Dragging: 9,
  Docked: 10,
};
type WindowState = (typeof WindowState)[keyof typeof WindowState];
const WindowStateKeys = Object.keys(WindowState);
let windowStateStr = (state: WindowState) => {
  return WindowStateKeys[state - 1];
};

const Shortcut = {
  FocusNext: "FocusNext",
  FocusPrev: "FocusPrev",
  DWMLeft: "DWMLeft",
  DWMRight: "DWMRight",

  FocusUp: "FocusUp",
  FocusDown: "FocusDown",
  FocusLeft: "FocusLeft",
  FocusRight: "FocusRight",

  ShiftLeft: "ShiftLeft",
  ShiftRight: "ShiftRight",
  ShiftUp: "ShiftUp",
  ShiftDown: "ShiftDown",

  SwapUp: "SwapUp",
  SwapDown: "SwapDown",
  SwapLeft: "SwapLeft",
  SwapRight: "SwapRight",

  GrowWidth: "GrowWidth",
  GrowHeight: "GrowHeight",
  ShrinkWidth: "ShrinkWidth",
  ShrinkHeight: "ShrinkHeight",

  Increase: "Increase",
  Decrease: "Decrease",
  ShiftIncrease: "ShiftIncrease", //NOTE: unused shortcut
  ShiftDecrease: "ShiftDecrease", //NOTE: unused shortcut

  ToggleFloat: "ToggleFloat",
  ToggleFloatAll: "ToggleFloatAll",
  SetMaster: "SetMaster",
  NextLayout: "NextLayout",
  PreviousLayout: "PreviousLayout",
  SetLayout: "SetLayout",

  Rotate: "Rotate",
  RotatePart: "RotatePart",

  ToggleDock: "ToggleDock",

  RaiseSurfaceCapacity: "RaiseSurfaceCapacity",
  LowerSurfaceCapacity: "LowerSurfaceCapacity",

  KrohnkiteMeta: "KrohnkiteMeta",

  MetaResetSurfaceCapacity: "MetaResetSurfaceCapacity",
  MetaFocusLeft: "MetaFocusLeft",
  MetaFocusRight: "MetaFocusRight",
  MetaFocusUp: "MetaFocusUp",
  MetaFocusDown: "MetaFocusDown",
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
  getSpreadLayout(): ShortcutHandler;
  getStairLayout(): ShortcutHandler;
  getFloatingLayout(): ShortcutHandler;
  getQuarterLayout(): ShortcutHandler;
  getStackedLayout(): ShortcutHandler;
  getColumnsLayout(): ShortcutHandler;
  getSpiralLayout(): ShortcutHandler;
  getBTreeLayout(): ShortcutHandler;

  getRaiseSurfaceCapacity(): ShortcutHandler;
  getLowerSurfaceCapacity(): ShortcutHandler;

  getKrohnkiteMeta(): ShortcutHandler;
}

interface IConfig {
  //Layouts
  tileLayoutInitialAngle: string;
  monocleMaximize: boolean;
  monocleMinimizeRest: boolean;
  quarterLayoutReset: boolean;
  columnsLayoutInitialAngle: string;
  columnsBalanced: boolean;
  columnsLayerConf: string[];
  stairReverse: boolean;
  layoutOrder: string[];
  layoutFactories: { [key: string]: () => ILayout };

  //Surfaces
  surfacesDefaultConfig: string[];
  surfacesIsMoveWindows: boolean;
  surfacesIsMoveOldestWindows: boolean;

  //Geometry
  screenGapTop: number;
  screenGapLeft: number;
  screenGapBetween: number;
  screenGapRight: number;
  screenGapBottom: number;
  gapsOverrideConfig: string[];
  limitTileWidthRatio: number;

  //Behavior
  adjustLayout: boolean;
  adjustLayoutLive: boolean;
  directionalKeyMode: "dwm" | "focus";
  focusNormalCfg: WinTypes;
  focusNormalDisableScreens: boolean;
  focusNormalDisableVDesktops: boolean;
  focusMetaCfg: WinTypes;
  focusMetaDisableScreens: boolean;
  focusMetaDisableVDesktops: boolean;
  defaultMetaConfig: { [key: string]: Shortcut };
  metaConf: string[];
  metaTimeout: number;
  metaIsToggle: boolean;
  metaIsPushedTwice: boolean;
  newWindowPosition: number;

  //Rules
  ignoreClass: string[];
  ignoreTitle: string[];
  ignoreRole: string[];

  floatingClass: string[];
  floatingTitle: string[];
  floatDefault: boolean;
  floatUtility: boolean;

  ignoreActivity: string[];
  ignoreScreen: string[];
  ignoreVDesktop: string[];
  tileNothing: boolean;
  tilingClass: string[];

  screenDefaultLayout: string[];

  //Dock
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

  //Options
  tiledWindowsLayer: WindowLayer;
  floatedWindowsLayer: WindowLayer;

  floatInit: IFloatInit | null;

  soleWindowWidth: number;
  soleWindowHeight: number;
  soleWindowNoBorders: boolean;
  soleWindowNoGaps: boolean;

  unfitGreater: boolean;
  unfitLess: boolean;

  notificationDuration: number;

  layoutPerActivity: boolean;
  layoutPerDesktop: boolean;
  noTileBorder: boolean;
  keepTilingOnDrag: boolean;
  preventMinimize: boolean;
  preventProtrusion: boolean;
  floatSkipPager: boolean;

  //log
}

interface IKrohnkiteMeta {
  state: boolean;
  lastPushed: number;
  toggleMode: boolean;
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
  readonly minSize: ISize;
  readonly maxSize: ISize;

  surface: ISurface;

  commit(geometry?: Rect, noBorder?: boolean, windowLayer?: WindowLayer): void;
  visible(srf: ISurface): boolean;
  getInitFloatGeometry(): Rect;
}

interface ISurfaceStore {
  getSurface(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop,
  ): ISurface;
}

interface ISurface {
  capacity: number | null;
  output: Output;
  readonly id: string;
  readonly layoutId: string;
  readonly ignore: boolean;
  readonly workingArea: Readonly<Rect>;
  readonly activity: string;
  readonly vDesktop: VirtualDesktop;

  next(): ISurface | null;
  getParams(): [string, string, string];
}

interface IDriverContext {
  readonly backend: string;
  readonly currentSurfaces: ISurface[];
  readonly cursorPosition: [number, number] | null;

  currentSurface: ISurface;
  currentWindow: WindowClass | null;
  isMetaMode: boolean;

  setTimeout(func: () => void, timeout: number): void;
  showNotification(text: string): void;
  moveWindowsToScreen(windowsToScreen: [Output, WindowClass[]][]): void;
  moveToScreen(window: WindowClass, direction: Direction): boolean;
  moveToVDesktop(window: WindowClass, direction: Direction): boolean;
  focusSpecial(direction: Direction): void;
  focusNeighborWindow(
    direction: Direction,
    winTypes: WinTypes,
  ): Window | null | boolean;
  focusOutput(
    window: Window | null,
    direction: Direction,
    winTypes: WinTypes,
  ): boolean;
  focusVDesktop(
    window: Window | null,
    direction: Direction,
    winTypes: WinTypes,
  ): void;
  metaPushed(): void;
}

interface ILayoutClass {
  readonly id: string;
  new (capacity?: number | null): ILayout;
}

interface ILayout {
  /* read-only */
  readonly capacity?: number | null;
  readonly description: string;

  /* methods */
  adjust?(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number,
  ): void;
  apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number,
  ): void;
  handleShortcut?(ctx: EngineContext, input: Shortcut, data?: any): boolean;
  drag?(
    ctx: EngineContext,
    draggingRect: Rect,
    window: WindowClass,
    workingArea: Rect,
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

interface ISize {
  width: number;
  height: number;
}

// Logging
const LogModules = {
  newWindowAdded: "newWindowAdded",
  newWindowFiltered: "newWindowFiltered",
  newWindowUnmanaged: "newWindowUnmanaged",

  screensChanged: "screensChanged",
  virtualScreenGeometryChanged: "virtualScreenGeometryChanged",
  currentActivityChanged: "currentActivityChanged",
  currentDesktopChanged: "currentDesktopChanged",
  windowAdded: "windowAdded",
  windowActivated: "windowActivated",
  windowRemoved: "windowRemoved",
  surfaceChanged: "surfaceChanged",

  activitiesChanged: "activitiesChanged",
  bufferGeometryChanged: "bufferGeometryChanged",
  desktopsChanged: "desktopsChanged",
  fullScreenChanged: "fullScreenChanged",
  interactiveMoveResizeStepped: "interactiveMoveResizeStepped",
  maximizedAboutToChange: "maximizedAboutToChange",
  minimizedChanged: "minimizedChanged",
  moveResizedChanged: "moveResizedChanged",
  outputChanged: "outputChanged",
  shortcut: "shortcut",
  arrangeScreen: "arrangeScreen",
  printConfig: "printConfig",
  setTimeout: "setTimeout",
  window: "window",
};
type LogModule = (typeof LogModules)[keyof typeof LogModules];

const LogPartitions = {
  newWindow: {
    number: 100,
    name: "newWindow",
    modules: [
      LogModules.newWindowAdded,
      LogModules.newWindowFiltered,
      LogModules.newWindowUnmanaged,
    ],
  },
  workspaceSignals: {
    number: 200,
    name: "workspaceSignal",
    modules: [
      LogModules.screensChanged,
      LogModules.virtualScreenGeometryChanged,
      LogModules.currentActivityChanged,
      LogModules.currentDesktopChanged,
      LogModules.windowAdded,
      LogModules.windowActivated,
      LogModules.windowRemoved,
      LogModules.surfaceChanged,
    ],
  },
  windowSignals: {
    number: 300,
    name: "windowSignal",
    modules: [
      LogModules.activitiesChanged,
      LogModules.bufferGeometryChanged,
      LogModules.desktopsChanged,
      LogModules.fullScreenChanged,
      LogModules.interactiveMoveResizeStepped,
      LogModules.maximizedAboutToChange,
      LogModules.minimizedChanged,
      LogModules.moveResizedChanged,
      LogModules.outputChanged,
    ],
  },
  other: {
    number: 1000,
    name: "other",
    modules: [
      LogModules.shortcut,
      LogModules.arrangeScreen,
      LogModules.printConfig,
      LogModules.setTimeout,
      LogModules.window,
    ],
  },
} as const;
type LogPartition = (typeof LogPartitions)[keyof typeof LogPartitions];

interface ILogModules {
  send(
    module?: LogModule,
    action?: string,
    message?: string,
    filters?: ILogFilters,
  ): void;
  print(module?: LogModule, action?: string, message?: string): void;
  isModuleOn(module: LogModule): boolean;
}

interface ILogFilters {
  winClass?: string[] | null;
}

interface IFloatInit {
  windowWidth: number;
  windowHeight: number;
  randomize: boolean;
  randomWidth: number;
  randomHeight: number;
}

// Globals
let CONFIG: IConfig;
let LOG: ILogModules | undefined;
