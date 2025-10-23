/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/
enum WinTypes {
  tiled = 1,
  docked = 2,
  float = 4,
  surfaces = 8,
  special = 16,
}
const winTypesCfg = [
  WinTypes.docked | WinTypes.float | WinTypes.tiled,
  WinTypes.surfaces,
  WinTypes.tiled,
  WinTypes.float,
  WinTypes.docked,
  WinTypes.tiled | WinTypes.float,
  WinTypes.tiled | WinTypes.docked,
  WinTypes.float | WinTypes.docked,
  WinTypes.special,
];

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
  /*
   * Geometry
   * */
  public screenGapTop: number;
  public screenGapLeft: number;
  public screenGapBetween: number;
  public screenGapRight: number;
  public screenGapBottom: number;
  public gapsOverrideConfig: string[];
  public limitTileWidthRatio: number;
  /*
   * Behavior
   * */
  public adjustLayout: boolean;
  public adjustLayoutLive: boolean;
  public directionalKeyMode: "dwm" | "focus";
  public focusNormalCfg: WinTypes;
  public focusMetaCfg: WinTypes;
  public focusNormalDisableScreens: boolean;
  public focusNormalDisableVDesktops: boolean;
  public focusMetaDisableScreens: boolean;
  public focusMetaDisableVDesktops: boolean;
  public defaultMetaConfig: { [key: string]: Shortcut };
  public metaConf: string[];
  public metaTimeout: number;
  public metaIsToggle: boolean;
  public metaIsPushedTwice: boolean;
  public newWindowPosition: number;
  /*
   * Rules
   * */
  public ignoreClass: string[];
  public ignoreTitle: string[];
  public ignoreRole: string[];

  public floatingClass: string[];
  public floatingTitle: string[];
  public floatDefault: boolean;
  public floatUtility: boolean;

  public ignoreActivity: string[];
  public ignoreScreen: string[];
  public ignoreVDesktop: string[];
  public tileNothing: boolean;
  public tilingClass: string[];

  public screenDefaultLayout: string[];
  /*
   * Dock
   * */
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
  /*
   * Options
   * */
  public tiledWindowsLayer: number;
  public floatedWindowsLayer: number;

  public soleWindowWidth: number;
  public soleWindowHeight: number;
  public soleWindowNoBorders: boolean;
  public soleWindowNoGaps: boolean;

  floatInit: IFloatInit | null;

  public unfitGreater: boolean;
  public unfitLess: boolean;

  public notificationDuration: number;

  public layoutPerActivity: boolean;
  public layoutPerDesktop: boolean;
  public noTileBorder: boolean;
  public keepTilingOnDrag: boolean;
  public preventMinimize: boolean;
  public preventProtrusion: boolean;
  public floatSkipPager: boolean;
  /*
   * Log
   * */

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
      "0",
    );
    this.monocleMaximize = KWIN.readConfig("monocleMaximize", true);
    this.monocleMinimizeRest = KWIN.readConfig("monocleMinimizeRest", false);
    this.quarterLayoutReset = KWIN.readConfig("quarterLayoutReset", false);
    this.columnsLayoutInitialAngle = KWIN.readConfig(
      "columnsLayoutInitialRotationAngle",
      "0",
    );
    this.columnsBalanced = KWIN.readConfig("columnsBalanced", false);
    this.columnsLayerConf = separate(
      KWIN.readConfig("columnsLayerConf", ""),
      ",",
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

    //***************************
    //****************** Surfaces
    //***************************
    this.surfacesDefaultConfig = separate(
      KWIN.readConfig("surfacesDefaultConfig", ""),
      "\n",
    );
    this.surfacesIsMoveWindows = KWIN.readConfig("surfacesIsMoveWindows", true);
    this.surfacesIsMoveOldestWindows = KWIN.readConfig(
      "surfacesIsMoveOldestWindows",
      false,
    );

    //***************************
    //****************** Geometry
    //***************************
    this.screenGapTop = KWIN.readConfig("screenGapTop", 0);
    this.screenGapLeft = KWIN.readConfig("screenGapLeft", 0);
    this.screenGapBetween = KWIN.readConfig("screenGapBetween", 0);
    this.screenGapRight = KWIN.readConfig("screenGapRight", 0);
    this.screenGapBottom = KWIN.readConfig("screenGapBottom", 0);
    this.gapsOverrideConfig = separate(
      KWIN.readConfig("gapsOverrideConfig", ""),
      "\n",
    );
    this.limitTileWidthRatio = 0;
    if (KWIN.readConfig("limitTileWidth", false))
      this.limitTileWidthRatio = KWIN.readConfig("limitTileWidthRatio", 1.6);

    //***************************
    //****************** Behavior
    //***************************
    this.adjustLayout = KWIN.readConfig("adjustLayout", true);
    this.adjustLayoutLive = KWIN.readConfig("adjustLayoutLive", true);
    this.directionalKeyMode = KWIN.readConfig("directionalKeyFocus", true)
      ? "focus"
      : "dwm";

    this.focusNormalCfg =
      winTypesCfg[
        validateNumberWithDefault(
          KWIN.readConfig("focusNormal", 0),
          0,
          "focusNormal",
          0,
          winTypesCfg.length,
        )
      ];
    this.focusMetaCfg =
      winTypesCfg[
        validateNumberWithDefault(
          KWIN.readConfig("focusMeta", 1),
          1,
          "focusMeta",
          0,
          winTypesCfg.length,
        )
      ];

    this.focusNormalDisableScreens = KWIN.readConfig(
      "focusNormalDisableScreens",
      false,
    );
    this.focusNormalDisableVDesktops = KWIN.readConfig(
      "focusNormalDisableVDesktops",
      false,
    );
    this.focusMetaDisableScreens = KWIN.readConfig(
      "focusMetaDisableScreens",
      false,
    );
    this.focusMetaDisableVDesktops = KWIN.readConfig(
      "focusMetaDisableVDesktops",
      false,
    );
    this.defaultMetaConfig = {
      RaiseSurfaceCapacity: Shortcut.MetaResetSurfaceCapacity,
      FocusLeft: Shortcut.MetaFocusLeft,
      FocusRight: Shortcut.MetaFocusRight,
      FocusUp: Shortcut.MetaFocusUp,
      FocusDown: Shortcut.MetaFocusDown,
    };
    this.metaConf = separate(KWIN.readConfig("metaConf", ""), "\n");
    this.metaTimeout = validateNumberWithDefault(
      KWIN.readConfig("metaTimeout", 3000),
      3000,
      "metaTimeout",
      100,
      9999,
    );
    this.metaIsToggle = KWIN.readConfig("metaIsToggle", false);
    this.metaIsPushedTwice = KWIN.readConfig("metaIsPushedTwice", false);

    this.newWindowPosition = KWIN.readConfig("newWindowPosition", 0);

    //***************************
    //****************** Rules
    //***************************
    this.ignoreClass = separate(
      KWIN.readConfig(
        "ignoreClass",
        "krunner,yakuake,spectacle,kded5,xwaylandvideobridge,plasmashell,ksplashqml,org.kde.plasmashell,org.kde.polkit-kde-authentication-agent-1,org.kde.kruler,kruler,kwin_wayland,ksmserver-logout-greeter",
      ),
      ",",
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
      ",",
    );

    //***************************
    //****************** Dock
    //***************************
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
      "\n",
    );
    this.dockWindowClassConfig = separate(
      KWIN.readConfig("dockWindowClassConfig", ""),
      "\n",
    );

    //***************************
    //****************** Options
    //***************************
    this.tiledWindowsLayer = getWindowLayer(
      KWIN.readConfig("tiledWindowsLayer", 0),
    );
    this.floatedWindowsLayer = getWindowLayer(
      KWIN.readConfig("floatedWindowsLayer", 1),
    );

    this.soleWindowWidth = KWIN.readConfig("soleWindowWidth", 100);
    this.soleWindowHeight = KWIN.readConfig("soleWindowHeight", 100);
    this.soleWindowNoBorders = KWIN.readConfig("soleWindowNoBorders", false);
    this.soleWindowNoGaps = KWIN.readConfig("soleWindowNoGaps", false);

    if (KWIN.readConfig("floatEnable", true)) {
      let windowWidth = validateNumberWithDefault(
        KWIN.readConfig("floatInitWindowWidth", 50),
        50,
        "floatInitWindowWidth",
        1,
        100,
      );
      let windowHeight = validateNumberWithDefault(
        KWIN.readConfig("floatInitWindowHeight", 50),
        50,
        "floatInitWindowHeight",
        1,
        100,
      );
      let randomize = KWIN.readConfig("floatRandomize", true);
      let randomWidth = validateNumberWithDefault(
        KWIN.readConfig("floatRandomWidth", 15),
        15,
        "floatRandomWidth",
        1,
        100,
      );
      let randomHeight = validateNumberWithDefault(
        KWIN.readConfig("floatRandomHeight", 15),
        15,
        "floatRandomHeight",
        1,
        100,
      );
      this.floatInit = {
        windowHeight,
        windowWidth,
        randomHeight,
        randomWidth,
        randomize,
      };
    } else this.floatInit = null;

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

    //***************************
    //****************** Log
    //***************************
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
          ",",
        );
        logParts.push([
          LogPartitions.workspaceSignals,
          workspaceSignalsSubmodules,
        ]);
      }
      if (KWIN.readConfig("logWindowSignals", false)) {
        let windowSignalsSubmodules = separate(
          KWIN.readConfig("logWindowSignalsSubmodules", ""),
          ",",
        );
        logParts.push([LogPartitions.windowSignals, windowSignalsSubmodules]);
      }
      if (KWIN.readConfig("logOther", false)) {
        let otherSubmodules = separate(
          KWIN.readConfig("logOtherSubmodules", ""),
          ",",
        );
        logParts.push([LogPartitions.other, otherSubmodules]);
      }
      const logFilters = KWIN.readConfig("logFilter", false)
        ? separate(KWIN.readConfig("logFilterStr", ""), ",")
        : [];
      LOG = new Logging(logParts, logFilters);
    } else LOG = undefined;
    //***************************
    //***************************
    //***************************
  }

  private static getSortedLayouts(
    layoutsList: [ILayoutClass, boolean][],
  ): ISortedLayouts[] {
    let sortedLayouts: ISortedLayouts[] = [];
    for (const [idx, [layoutClass, isCapacity]] of layoutsList.entries()) {
      let orderConfigKey = `${unCapitalize(layoutClass.id)}Order`;
      let validatedOrder = validateNumber(
        KWIN.readConfig(orderConfigKey, idx + 1),
        0,
        12,
      );
      if (validatedOrder instanceof Err) {
        validatedOrder = idx + 1;
        warning(
          `kwinconfig: layout order for ${layoutClass.id} is invalid, using default value ${validatedOrder}`,
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
          99,
        );
        if (capacity instanceof Err) {
          warning(
            `kwinconfig: layout capacity for ${layoutClass.id} is invalid: ${capacity}`,
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
