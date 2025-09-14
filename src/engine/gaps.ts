// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class DefaultGapsCfg implements IGaps {
  static _gapsInstance: DefaultGapsCfg;

  public readonly left: number;
  public readonly right: number;
  public readonly top: number;
  public readonly bottom: number;
  public readonly between: number;

  private constructor() {
    let left = validateNumber(CONFIG.screenGapLeft);
    if (left instanceof Err) {
      warning(`DefaultGapsCfg: left: ${left}`);
      this.left = 0;
    } else this.left = left;
    let right = validateNumber(CONFIG.screenGapRight);
    if (right instanceof Err) {
      warning(`DefaultGapsCfg: right: ${right}`);
      this.right = 0;
    } else this.right = right;
    let top = validateNumber(CONFIG.screenGapTop);
    if (top instanceof Err) {
      warning(`DefaultGapsCfg: top: ${top}`);
      this.top = 0;
    } else this.top = top;
    let bottom = validateNumber(CONFIG.screenGapBottom);
    if (bottom instanceof Err) {
      warning(`DefaultGapsCfg: bottom: ${bottom}`);
      this.bottom = 0;
    } else this.bottom = bottom;
    let between = validateNumber(CONFIG.screenGapBetween);
    if (between instanceof Err) {
      warning(`DefaultGapsCfg: between: ${between}`);
      this.between = 0;
    } else this.between = between;
  }
  public static get instance(): DefaultGapsCfg {
    if (!DefaultGapsCfg._gapsInstance) {
      DefaultGapsCfg._gapsInstance = new DefaultGapsCfg();
    }
    return DefaultGapsCfg._gapsInstance;
  }
  public cloneAndUpdate(cfg: Partial<IGaps>): IGaps {
    return Object.assign({} as IGaps, DefaultGapsCfg.instance, cfg);
  }
}

class gapsSurfaceCfg {
  public outputName: string;
  public activityId: string;
  public vDesktopName: string;
  public cfg: IGaps;

  constructor(
    outputName: string,
    activityId: string,
    vDesktopName: string,
    cfg: IGaps
  ) {
    this.outputName = outputName;
    this.activityId = activityId;
    this.vDesktopName = vDesktopName;
    this.cfg = cfg;
  }
  public isFit(srf: ISurface): boolean {
    return (
      (this.outputName === "" || this.outputName === srf.output.name) &&
      (this.vDesktopName === "" || this.vDesktopName === srf.vDesktop.name) &&
      (this.activityId === "" || this.activityId === srf.activity)
    );
  }
  public toString(): string {
    return `gapsSurfaceCfg: Output Name: ${this.outputName}, Activity ID: ${this.activityId}, Virtual Desktop Name: ${this.vDesktopName} cfg: ${this.cfg}`;
  }

  public static parseGapsUserSurfacesCfg(): gapsSurfaceCfg[] {
    let surfacesCfg: gapsSurfaceCfg[] = [];
    if (CONFIG.gapsOverrideConfig.length === 0) return surfacesCfg;
    CONFIG.gapsOverrideConfig.forEach((cfg) => {
      let surfaceCfgString = cfg.split(":").map((part) => part.trim());
      if ([2, 4].indexOf(surfaceCfgString.length) < 0) {
        warning(
          `Invalid Gaps surface config: ${cfg}, config must have one or three colons`
        );
        return;
      }
      let outputName = surfaceCfgString[0];
      let activityId: string;
      let vDesktopName: string;
      let userCfg: string;
      if (surfaceCfgString.length === 4) {
        activityId = surfaceCfgString[1];
        vDesktopName = surfaceCfgString[2];
        userCfg = surfaceCfgString[3];
      } else {
        activityId = "";
        vDesktopName = "";
        userCfg = surfaceCfgString[1];
      }
      let splittedUserCfg = userCfg
        .split(",")
        .map((part) => part.trim().toLowerCase());
      let partialGapsCfg = gapsSurfaceCfg.parseSplittedGapsCfg(splittedUserCfg);
      if (partialGapsCfg instanceof Err) {
        warning(`Invalid Gaps User surface config: ${cfg}. ${partialGapsCfg}`);
        return;
      }
      if (Object.keys(partialGapsCfg).length > 0) {
        surfacesCfg.push(
          new gapsSurfaceCfg(
            outputName,
            activityId,
            vDesktopName,
            DefaultGapsCfg.instance.cloneAndUpdate(partialGapsCfg) as IGaps
          )
        );
      }
    });
    return surfacesCfg;
  }
  private static parseSplittedGapsCfg(
    splittedUserCfg: string[]
  ): Partial<IGaps> | Err {
    let errors: string[] = [];
    let value: number | Err;
    let gapsCfg: {
      [gapsCfgField: string]: number;
    } = {};
    splittedUserCfg.forEach((part) => {
      let splittedPart = part
        .split("=")
        .map((part) => part.trim().toLowerCase());
      if (splittedPart.length !== 2) {
        errors.push(`"${part}" can have only one equal sign`);
        return;
      }
      if (splittedPart[0].length === 0 || splittedPart[1].length === 0) {
        errors.push(`"${part}" can not have empty name or value`);
        return;
      }

      value = validateNumber(splittedPart[1]);
      if (value instanceof Err) {
        errors.push(`GapsCfg: ${part}, ${splittedPart[1]} ${value}`);
        return;
      }
      switch (splittedPart[0]) {
        case "left":
        case "l":
          gapsCfg["left"] = value;
          break;
        case "right":
        case "r":
          gapsCfg["right"] = value;
          break;
        case "top":
        case "t":
          gapsCfg["top"] = value;
          break;
        case "bottom":
        case "b":
          gapsCfg["bottom"] = value;
          break;
        case "between":
        case "e":
          gapsCfg["between"] = value;
          break;
        default:
          errors.push(
            ` "${part}" unknown parameter name. It can be l,r,t,b,e or left,right,top,bottom,between`
          );
          return;
      }
    });
    if (errors.length > 0) {
      return new Err(errors.join("\n"));
    }
    return gapsCfg as Partial<IGaps>;
  }
}
