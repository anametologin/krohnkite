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

class KWinConfig implements IConfig {
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

  //#region Layout
  public layoutOrder: string[];
  public layoutFactories: { [key: string]: () => ILayout };
  public soleWindowWidth: number;
  public soleWindowHeight: number;
  public soleWindowNoBorders: boolean;
  public soleWindowNoGaps: boolean;
  public tileLayoutInitialAngle: string;
  public quarterLayoutReset: boolean;
  public columnsLayoutInitialAngle: string;
  public columnsBalanced: boolean;
  public columnsLayerConf: string[];
  public tiledWindowsLayer: number;
  public floatedWindowsLayer: number;
  public raiseAllMosaicTileWindowsAtOnce: boolean;
  public monocleMaximize: boolean;
  public monocleMinimizeRest: boolean;
  public stairReverse: boolean; // kwin.specific
  //#endregion

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
  public pollMouseXdotool: boolean;
  //#endregion

  //#region kwin.specific Rules
  public floatUtility: boolean;

  public floatingClass: string[];
  public floatingTitle: string[];
  public ignoreClass: string[];
  public ignoreTitle: string[];
  public ignoreRole: string[];

  public ignoreActivity: string[];
  public ignoreScreen: string[];
  public ignoreVDesktop: string[];

  public screenDefaultLayout: string[];

  public tileNothing: boolean;
  public tilingClass: string[];
  //#endregion
  public debugActiveWin: boolean;

  constructor() {
    function commaSeparate(str: string): string[] {
      if (!str || typeof str !== "string") return [];
      return str
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part != "");
    }

    function newLineSeparate(str: string): string[] {
      if (!str || typeof str !== "string") return [];
      return str
        .split("\n")
        .map((part) => part.trim())
        .filter((part) => part != "");
    }

    DEBUG.enabled = DEBUG.enabled || KWIN.readConfig("debug", false);

    this.layoutOrder = [];

    interface ISortedLayouts {
      order: number;
      layoutClass: ILayoutClass;
    }
    let sortedLayouts: ISortedLayouts[] = [];

    this.layoutFactories = {};
    (
      [
        ["tileLayoutOrder", 1, TileLayout],
        ["monocleLayoutOrder", 2, MonocleLayout],
        ["threeColumnLayoutOrder", 3, ThreeColumnLayout],
        ["spiralLayoutOrder", 4, SpiralLayout],
        ["quarterLayoutOrder", 5, QuarterLayout],
        ["stackedLayoutOrder", 6, StackedLayout],
        ["columnsLayoutOrder", 7, ColumnsLayout],
        ["spreadLayoutOrder", 8, SpreadLayout],
        ["floatingLayoutOrder", 9, FloatingLayout],
        ["stairLayoutOrder", 10, StairLayout],
        ["binaryTreeLayoutOrder", 11, BTreeLayout],
        ["cascadeLayoutOrder", 12, CascadeLayout],
      ] as Array<[string, number, ILayoutClass]>
    ).forEach(([configKey, defaultValue, layoutClass]) => {
      let order = validateNumber(
        KWIN.readConfig(configKey, defaultValue),
        0,
        12
      );
      if (order instanceof Err) {
        order = defaultValue;
        warning(
          `kwinconfig: layout order for ${layoutClass.id} is invalid, using default value ${order}`
        );
      }
      if (order === 0) return;
      sortedLayouts.push({ order: order, layoutClass: layoutClass });
    });
    sortedLayouts.sort((a, b) => a.order - b.order);
    if (sortedLayouts.length === 0) {
      sortedLayouts.push({ order: 1, layoutClass: TileLayout });
    }
    sortedLayouts.forEach(({ layoutClass }) => {
      this.layoutOrder.push(layoutClass.id);
      this.layoutFactories[layoutClass.id] = () => new layoutClass();
    });

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
    this.dockSurfacesConfig = newLineSeparate(
      KWIN.readConfig("dockSurfacesConfig", "")
    );
    this.dockWindowClassConfig = newLineSeparate(
      KWIN.readConfig("dockWindowClassConfig", "")
    );

    this.soleWindowWidth = KWIN.readConfig("soleWindowWidth", 100);
    this.soleWindowHeight = KWIN.readConfig("soleWindowHeight", 100);
    this.soleWindowNoBorders = KWIN.readConfig("soleWindowNoBorders", false);
    this.soleWindowNoGaps = KWIN.readConfig("soleWindowNoGaps", false);
    this.tileLayoutInitialAngle = KWIN.readConfig(
      "tileLayoutInitialRotationAngle",
      "0"
    );
    this.columnsLayoutInitialAngle = KWIN.readConfig(
      "columnsLayoutInitialRotationAngle",
      "0"
    );
    this.columnsBalanced = KWIN.readConfig("columnsBalanced", false);
    this.columnsLayerConf = commaSeparate(
      KWIN.readConfig("columnsLayerConf", "")
    );
    this.tiledWindowsLayer = getWindowLayer(
      KWIN.readConfig("tiledWindowsLayer", 0)
    );
    this.floatedWindowsLayer = getWindowLayer(
      KWIN.readConfig("floatedWindowsLayer", 1)
    );
    this.raiseAllMosaicTileWindowsAtOnce = KWIN.readConfig("raiseAllMosaicTileWindowsAtOnce", true);
    this.quarterLayoutReset = KWIN.readConfig("quarterLayoutReset", false);
    this.monocleMaximize = KWIN.readConfig("monocleMaximize", true);
    this.monocleMinimizeRest = KWIN.readConfig("monocleMinimizeRest", false);
    this.stairReverse = KWIN.readConfig("stairReverse", false);

    this.adjustLayout = KWIN.readConfig("adjustLayout", true);
    this.adjustLayoutLive = KWIN.readConfig("adjustLayoutLive", true);
    this.keepTilingOnDrag = KWIN.readConfig("keepTilingOnDrag", true);
    this.noTileBorder = KWIN.readConfig("noTileBorder", false);

    this.limitTileWidthRatio = 0;
    if (KWIN.readConfig("limitTileWidth", false))
      this.limitTileWidthRatio = KWIN.readConfig("limitTileWidthRatio", 1.6);

    this.screenGapBottom = KWIN.readConfig("screenGapBottom", 0);
    this.screenGapLeft = KWIN.readConfig("screenGapLeft", 0);
    this.screenGapRight = KWIN.readConfig("screenGapRight", 0);
    this.screenGapTop = KWIN.readConfig("screenGapTop", 0);
    this.screenGapBetween = KWIN.readConfig("screenGapBetween", 0);
    this.gapsOverrideConfig = newLineSeparate(
      KWIN.readConfig("gapsOverrideConfig", "")
    );

    const directionalKeyDwm = KWIN.readConfig("directionalKeyDwm", false);
    const directionalKeyFocus = KWIN.readConfig("directionalKeyFocus", true);
    this.directionalKeyMode = directionalKeyDwm ? "dwm" : "focus";
    this.newWindowPosition = KWIN.readConfig("newWindowPosition", 0);

    this.layoutPerActivity = KWIN.readConfig("layoutPerActivity", true);
    this.layoutPerDesktop = KWIN.readConfig("layoutPerDesktop", true);
    this.floatUtility = KWIN.readConfig("floatUtility", true);
    this.preventMinimize = KWIN.readConfig("preventMinimize", false);
    this.preventProtrusion = KWIN.readConfig("preventProtrusion", true);
    this.notificationDuration = KWIN.readConfig("notificationDuration", 1000);
    this.pollMouseXdotool = KWIN.readConfig("pollMouseXdotool", false);

    this.floatingClass = commaSeparate(KWIN.readConfig("floatingClass", ""));
    this.floatingTitle = commaSeparate(KWIN.readConfig("floatingTitle", ""));
    this.ignoreActivity = commaSeparate(KWIN.readConfig("ignoreActivity", ""));
    this.ignoreClass = commaSeparate(
      KWIN.readConfig(
        "ignoreClass",
        "krunner,yakuake,spectacle,kded5,xwaylandvideobridge,plasmashell,ksplashqml,org.kde.plasmashell,org.kde.polkit-kde-authentication-agent-1,org.kde.kruler,kruler,kwin_wayland,ksmserver-logout-greeter"
      )
    );
    this.ignoreRole = commaSeparate(KWIN.readConfig("ignoreRole", "quake"));

    this.ignoreScreen = commaSeparate(KWIN.readConfig("ignoreScreen", ""));
    this.ignoreVDesktop = commaSeparate(KWIN.readConfig("ignoreVDesktop", ""));
    this.ignoreTitle = commaSeparate(KWIN.readConfig("ignoreTitle", ""));

    this.screenDefaultLayout = commaSeparate(
      KWIN.readConfig("screenDefaultLayout", "")
    );

    this.tilingClass = commaSeparate(KWIN.readConfig("tilingClass", ""));
    this.tileNothing = KWIN.readConfig("tileNothing", false);

    if (this.preventMinimize && this.monocleMinimizeRest) {
      debug(
        () => "preventMinimize is disabled because of monocleMinimizeRest."
      );
      this.preventMinimize = false;
    }

    this.debugActiveWin = KWIN.readConfig("debugActiveWin", false);
  }

  public toString(): string {
    return "Config(" + JSON.stringify(this, undefined, 2) + ")";
  }
}

// /* HACK: save casting */
var KWINCONFIG: KWinConfig;
