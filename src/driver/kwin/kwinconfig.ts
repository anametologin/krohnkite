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

interface ISortedLayouts {
  order: number;
  layoutClass: ILayoutClass;
  isCapacity: boolean;
}

class KWinConfig implements IConfig {
  /*
   * Layouts
   * */
  public tileLayoutInitialAngle: string;
  public monocleMaximize: boolean;
  public monocleMinimizeRest: boolean;
  public quarterLayoutReset: boolean;
  public columnsLayoutInitialAngle: string;
  public columnsBalanced: boolean;
  public columnsLayerConf: string[];
  public stairReverse: boolean;
  public layoutOrder: string[];
  public layoutFactories: { [key: string]: () => ILayout };
  /*
   * Surfaces
   * */
  public surfacesDefaultConfig: string[];
  public surfacesIsMoveWindows: boolean;
  public surfacesIsMoveOldestWindows: boolean;

  public soleWindowWidth: number;
  public soleWindowHeight: number;
  public soleWindowNoBorders: boolean;
  public soleWindowNoGaps: boolean;
  public unfitGreater: boolean;
  public unfitLess: boolean;
  public tiledWindowsLayer: number;
  public floatedWindowsLayer: number;
  //#endregion
  // Dock parameters
  public dockOrder: [number, number, number, number];
  public dockHHeight: number;
  public dockHWide: number;
  public dockHGap: number;
  public dockHEdgeGap: number;
  public dockHAlignment: number;
  public dockHEdgeAlignment: number;
  public dockVHeight: number;
  public dockVWide: number;
  public dockVGap: number;
  public dockVEdgeGap: number;
  public dockVAlignment: number;
  public dockVEdgeAlignment: number;
  public dockSurfacesConfig: string[];
  public dockWindowClassConfig: string[];

  //#region Features
  public adjustLayout: boolean;
  public adjustLayoutLive: boolean;
  public keepTilingOnDrag: boolean;
  public notificationDuration: number;
  public noTileBorder: boolean;
  public limitTileWidthRatio: number;
  //#endregion

  //#region Gap
  public screenGapBottom: number;
  public screenGapLeft: number;
  public screenGapRight: number;
  public screenGapTop: number;
  public screenGapBetween: number;
  public gapsOverrideConfig: string[];
  //#endregion

  //#region Behavior
  public directionalKeyMode: "dwm" | "focus";
  public newWindowPosition: number;
  //#endregion

  //#region kwin.specific
  public layoutPerActivity: boolean;
  public layoutPerDesktop: boolean;
  public preventMinimize: boolean;
  public preventProtrusion: boolean;
  public floatSkipPager: boolean;
  //#endregion

  //#region kwin.specific Rules
  public floatUtility: boolean;

  public floatingClass: string[];
  public floatingTitle: string[];
  public ignoreClass: string[];
  public floatDefault: boolean;
  public ignoreTitle: string[];
  public ignoreRole: string[];

  public ignoreActivity: string[];
  public ignoreScreen: string[];
  public ignoreVDesktop: string[];

  public screenDefaultLayout: string[];

  public tileNothing: boolean;
  public tilingClass: string[];
  //#endregion

  constructor() {
    function separate(str: string, separator: string): string[] {
      if (!str || typeof str !== "string") return [];
      return str
        .split(separator)
        .map((part) => part.trim())
        .filter((part) => part != "");
    }
    /***************************
     ****************** Layouts
     **************************/
    this.tileLayoutInitialAngle = KWIN.readConfig(
      "tileLayoutInitialRotationAngle",
      "0"
    );
    this.monocleMaximize = KWIN.readConfig("monocleMaximize", true);
    this.monocleMinimizeRest = KWIN.readConfig("monocleMinimizeRest", false);
    this.quarterLayoutReset = KWIN.readConfig("quarterLayoutReset", false);
    this.columnsLayoutInitialAngle = KWIN.readConfig(
      "columnsLayoutInitialRotationAngle",
      "0"
    );
    this.columnsBalanced = KWIN.readConfig("columnsBalanced", false);
    this.columnsLayerConf = separate(
      KWIN.readConfig("columnsLayerConf", ""),
      ","
    );
    this.stairReverse = KWIN.readConfig("stairReverse", false);

    const layoutsList = [
      [TileLayout, true],
      [MonocleLayout, false],
      [ThreeColumnLayout, true],
      [SpiralLayout, true],
      [QuarterLayout, false],
      [StackedLayout, true],
      [ColumnsLayout, true],
      [SpreadLayout, true],
      [FloatingLayout, true],
      [StairLayout, true],
      [BinaryTreeLayout, true],
      [CascadeLayout, true],
    ] as Array<[ILayoutClass, boolean]>;
    const sortedLayouts: ISortedLayouts[] =
      KWinConfig.getSortedLayouts(layoutsList);
    this.layoutOrder = KWinConfig.getLayoutOrder(sortedLayouts);
    this.layoutFactories = KWinConfig.getLayoutFactories(sortedLayouts);
    sortedLayouts.forEach(({ layoutClass, isCapacity }) => {
      this.layoutOrder.push(layoutClass.id);
    });

    /***************************
     ****************** Surfaces
     **************************/
    this.surfacesDefaultConfig = separate(
      KWIN.readConfig("surfacesDefaultConfig", ""),
      "\n"
    );
    this.surfacesIsMoveWindows = KWIN.readConfig("surfacesIsMoveWindows", true);
    this.surfacesIsMoveOldestWindows = KWIN.readConfig(
      "surfacesIsMoveOldestWindows",
      false
    );

    /***************************
     ****************** Geometry
     **************************/
    this.screenGapTop = KWIN.readConfig("screenGapTop", 0);
    this.screenGapLeft = KWIN.readConfig("screenGapLeft", 0);
    this.screenGapBetween = KWIN.readConfig("screenGapBetween", 0);
    this.screenGapRight = KWIN.readConfig("screenGapRight", 0);
    this.screenGapBottom = KWIN.readConfig("screenGapBottom", 0);
    this.gapsOverrideConfig = separate(
      KWIN.readConfig("gapsOverrideConfig", ""),
      "\n"
    );
    this.limitTileWidthRatio = 0;
    if (KWIN.readConfig("limitTileWidth", false))
      this.limitTileWidthRatio = KWIN.readConfig("limitTileWidthRatio", 1.6);

    /***************************
     ****************** Behavior
     **************************/
    this.adjustLayout = KWIN.readConfig("adjustLayout", true);
    this.adjustLayoutLive = KWIN.readConfig("adjustLayoutLive", true);
    this.directionalKeyMode = KWIN.readConfig("directionalKeyFocus", true)
      ? "focus"
      : "dwm";
    this.newWindowPosition = KWIN.readConfig("newWindowPosition", 0);

    /***************************
     ****************** Rules
     **************************/
    this.ignoreClass = separate(
      KWIN.readConfig(
        "ignoreClass",
        "krunner,yakuake,spectacle,kded5,xwaylandvideobridge,plasmashell,ksplashqml,org.kde.plasmashell,org.kde.polkit-kde-authentication-agent-1,org.kde.kruler,kruler,kwin_wayland,ksmserver-logout-greeter"
      ),
      ","
    );
    this.ignoreTitle = separate(KWIN.readConfig("ignoreTitle", ""), ",");
    this.ignoreRole = separate(KWIN.readConfig("ignoreRole", "quake"), ",");

    this.floatingClass = separate(KWIN.readConfig("floatingClass", ""), ",");
    this.floatingTitle = separate(KWIN.readConfig("floatingTitle", ""), ",");
    this.floatDefault = KWIN.readConfig("floatDefault", false);
    this.floatUtility = KWIN.readConfig("floatUtility", true);

    this.ignoreActivity = separate(KWIN.readConfig("ignoreActivity", ""), ",");
    this.ignoreScreen = separate(KWIN.readConfig("ignoreScreen", ""), ",");
    this.ignoreVDesktop = separate(KWIN.readConfig("ignoreVDesktop", ""), ",");
    this.tileNothing = KWIN.readConfig("tileNothing", false);
    this.tilingClass = separate(KWIN.readConfig("tilingClass", ""), ",");

    this.screenDefaultLayout = separate(
      KWIN.readConfig("screenDefaultLayout", ""),
      ","
    );

    /***************************
     ****************** Dock
     **************************/
    this.dockOrder = [
      KWIN.readConfig("dockOrderLeft", 1),
      KWIN.readConfig("dockOrderTop", 2),
      KWIN.readConfig("dockOrderRight", 3),
      KWIN.readConfig("dockOrderBottom", 4),
    ];
    this.dockHHeight = KWIN.readConfig("dockHHeight", 15);
    this.dockHWide = KWIN.readConfig("dockHWide", 100);
    this.dockHGap = KWIN.readConfig("dockHGap", 0);
    this.dockHEdgeGap = KWIN.readConfig("dockHEdgeGap", 0);
    this.dockHAlignment = KWIN.readConfig("dockHAlignment", 0);
    this.dockHEdgeAlignment = KWIN.readConfig("dockHEdgeAlignment", 0);
    this.dockVHeight = KWIN.readConfig("dockVHeight", 100);
    this.dockVWide = KWIN.readConfig("dockVWide", 15);
    this.dockVEdgeGap = KWIN.readConfig("dockVEdgeGap", 0);
    this.dockVGap = KWIN.readConfig("dockVGap", 0);
    this.dockVAlignment = KWIN.readConfig("dockVAlignment", 0);
    this.dockVEdgeAlignment = KWIN.readConfig("dockVEdgeAlignment", 0);
    this.dockSurfacesConfig = separate(
      KWIN.readConfig("dockSurfacesConfig", ""),
      "\n"
    );
    this.dockWindowClassConfig = separate(
      KWIN.readConfig("dockWindowClassConfig", ""),
      "\n"
    );

    /***************************
     ****************** Options
     **************************/
    this.tiledWindowsLayer = getWindowLayer(
      KWIN.readConfig("tiledWindowsLayer", 0)
    );
    this.floatedWindowsLayer = getWindowLayer(
      KWIN.readConfig("floatedWindowsLayer", 1)
    );

    this.soleWindowWidth = KWIN.readConfig("soleWindowWidth", 100);
    this.soleWindowHeight = KWIN.readConfig("soleWindowHeight", 100);
    this.soleWindowNoBorders = KWIN.readConfig("soleWindowNoBorders", false);
    this.soleWindowNoGaps = KWIN.readConfig("soleWindowNoGaps", false);

    this.unfitGreater = KWIN.readConfig("unfitGreater", true);
    this.unfitLess = KWIN.readConfig("unfitLess", true);

    this.notificationDuration = KWIN.readConfig("notificationDuration", 1000);

    this.layoutPerActivity = KWIN.readConfig("layoutPerActivity", true);
    this.layoutPerDesktop = KWIN.readConfig("layoutPerDesktop", true);
    this.noTileBorder = KWIN.readConfig("noTileBorder", false);
    this.keepTilingOnDrag = KWIN.readConfig("keepTilingOnDrag", true);
    this.preventMinimize = KWIN.readConfig("preventMinimize", false);
    if (this.preventMinimize && this.monocleMinimizeRest) {
      this.preventMinimize = false;
    }
    this.preventProtrusion = KWIN.readConfig("preventProtrusion", true);
    this.floatSkipPager = KWIN.readConfig("floatSkipPagerWindows", false);

    /***************************
     ****************** Log
     **************************/
    if (KWIN.readConfig("logging", false)) {
      let logParts: [LogPartition, string[]][] = [];
      let newWindowSubmodules: string[] = [];
      if (KWIN.readConfig("logNewWindows", false))
        newWindowSubmodules.push("1");
      if (KWIN.readConfig("logFilteredWindows", false))
        newWindowSubmodules.push("2");
      if (KWIN.readConfig("logUnmanagedWindows", false))
        newWindowSubmodules.push("3");
      if (newWindowSubmodules.length > 0)
        logParts.push([LogPartitions.newWindow, newWindowSubmodules]);

      if (KWIN.readConfig("logWorkspaceSignals", false)) {
        let workspaceSignalsSubmodules = separate(
          KWIN.readConfig("logWorkspaceSignalsSubmodules", ""),
          ","
        );
        logParts.push([
          LogPartitions.workspaceSignals,
          workspaceSignalsSubmodules,
        ]);
      }
      if (KWIN.readConfig("logWindowSignals", false)) {
        let windowSignalsSubmodules = separate(
          KWIN.readConfig("logWindowSignalsSubmodules", ""),
          ","
        );
        logParts.push([LogPartitions.windowSignals, windowSignalsSubmodules]);
      }
      if (KWIN.readConfig("logOther", false)) {
        let otherSubmodules = separate(
          KWIN.readConfig("logOtherSubmodules", ""),
          ","
        );
        logParts.push([LogPartitions.other, otherSubmodules]);
      }
      const logFilters = KWIN.readConfig("logFilter", false)
        ? separate(KWIN.readConfig("logFilterStr", ""), ",")
        : [];
      LOG = new Logging(logParts, logFilters);
    } else LOG = undefined;
    /***************************
     ***************************
     **************************/
  }

  private static getSortedLayouts(
    layoutsList: [ILayoutClass, boolean][]
  ): ISortedLayouts[] {
    let sortedLayouts: ISortedLayouts[] = [];
    for (const [idx, [layoutClass, isCapacity]] of layoutsList.entries()) {
      let orderConfigKey = `${unCapitalize(layoutClass.id)}Order`;
      let validatedOrder = validateNumber(
        KWIN.readConfig(orderConfigKey, idx + 1),
        0,
        12
      );
      if (validatedOrder instanceof Err) {
        validatedOrder = idx + 1;
        warning(
          `kwinconfig: layout order for ${layoutClass.id} is invalid, using default value ${validatedOrder}`
        );
      }
      if (validatedOrder === 0) continue;
      sortedLayouts.push({
        order: validatedOrder as number,
        layoutClass: layoutClass,
        isCapacity: isCapacity,
      });
    }
    sortedLayouts.sort((a, b) => a.order - b.order);
    if (sortedLayouts.length === 0) {
      sortedLayouts.push({
        order: 1,
        layoutClass: TileLayout,
        isCapacity: false,
      });
    }
    return sortedLayouts;
  }
  private static getLayoutOrder(sortedLayouts: ISortedLayouts[]): string[] {
    let layoutOrder: string[] = [];
    sortedLayouts.forEach(({ layoutClass }) => {
      layoutOrder.push(layoutClass.id);
    });
    return layoutOrder;
  }

  private static getLayoutFactories(sortedLayouts: ISortedLayouts[]): {
    [key: string]: () => ILayout;
  } {
    let layoutFactories: { [key: string]: () => ILayout } = {};
    sortedLayouts.forEach(({ layoutClass, isCapacity }) => {
      if (isCapacity) {
        const capacityConfigKey = `${unCapitalize(layoutClass.id)}Capacity`;
        let capacity = validateNumber(
          KWIN.readConfig(capacityConfigKey, 99),
          0,
          99
        );
        if (capacity instanceof Err) {
          warning(
            `kwinconfig: layout capacity for ${layoutClass.id} is invalid: ${capacity}`
          );
          layoutFactories[layoutClass.id] = () => new layoutClass(null);
        } else if (capacity === 0 || capacity > 98) {
          layoutFactories[layoutClass.id] = () => new layoutClass(null);
        } else {
          layoutFactories[layoutClass.id] = () => new layoutClass(capacity);
        }
      } else {
        layoutFactories[layoutClass.id] = () => new layoutClass();
      }
    });
    return layoutFactories;
  }

  public toString(): string {
    return "Config(" + JSON.stringify(this, undefined, 2) + ")";
  }
}

// /* HACK: save casting */
var KWINCONFIG: KWinConfig;
