// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

type percentType = number;

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

  RaiseSurfaceCapacity: 33,
  LowerSurfaceCapacity: 34,
} as const;
type Shortcut = (typeof Shortcut)[keyof typeof Shortcut];

const ShortcutsKeys = Object.keys(Shortcut);

let ShortcutStr = (shortcut: Shortcut) => {
  return ShortcutsKeys[shortcut - 1];
};

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
}

//#region Driver

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

  soleWindowWidth: number;
  soleWindowHeight: number;
  soleWindowNoBorders: boolean;
  soleWindowNoGaps: boolean;

  floatInitWindowWidth: number;
  floatInitWindowHeight: number;
  floatRandomize: boolean;
  floatRandomWidth: number;
  floatRandomHeight: number;

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
    vDesktop: VirtualDesktop
  ): ISurface;
}

interface ISurface {
  capacity: number | null;
  output: Output;
  readonly id: string;
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

  setTimeout(func: () => void, timeout: number): void;
  showNotification(text: string): void;
  moveWindowsToScreen(windowsToScreen: [Output, WindowClass[]][]): void;
  moveToScreen(window: WindowClass, direction: Direction): void;
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

interface ISize {
  width: number;
  height: number;
}

// Logging
const LogModules = {
  newWindowAdded: 1,
  newWindowFiltered: 2,
  newWindowUnmanaged: 3,
  screensChanged: 4,
  virtualScreenGeometryChanged: 5,
  currentActivityChanged: 6,
  currentDesktopChanged: 7,
  windowAdded: 8,
  windowActivated: 9,
  windowRemoved: 10,
  activitiesChanged: 11,
  bufferGeometryChanged: 12,
  desktopsChanged: 13,
  fullScreenChanged: 14,
  interactiveMoveResizeStepped: 15,
  maximizedAboutToChange: 16,
  minimizedChanged: 17,
  moveResizedChanged: 18,
  outputChanged: 19,
  shortcut: 20,
  arrangeScreen: 21,
  printConfig: 22,
  setTimeout: 23,
  window: 24,
};
type LogModule = (typeof LogModules)[keyof typeof LogModules];

const LogModulesKeys = Object.keys(LogModules);

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
    filters?: ILogFilters
  ): void;
  print(module?: LogModule, action?: string, message?: string): void;
  isModuleOn(module: LogModule): boolean;
}

interface ILogFilters {
  winClass?: string[] | null;
}

// Globals
let CONFIG: IConfig;
let LOG: ILogModules | undefined;
