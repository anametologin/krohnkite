// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class DefaultDockCfg implements IDockCfg {
  static _dockInstance: DefaultDockCfg;

  public readonly hHeight: number;
  public readonly hWide: number;
  public readonly hEdgeGap: number;
  public readonly hGap: number;
  public readonly hAlignment: HDockAlignment;
  public readonly hEdgeAlignment: EdgeAlignment;
  public readonly vHeight: number;
  public readonly vWide: number;
  public readonly vEdgeGap: number;
  public readonly vGap: number;
  public readonly vEdgeAlignment: EdgeAlignment;
  public readonly vAlignment: VDockAlignment;

  private constructor() {
    // dock sizes
    let hHeight = validateNumber(CONFIG.dockHHeight, 1, 50);
    if (hHeight instanceof Err) {
      warning(`getDefaultCfg: hHeight: ${hHeight}`);
      this.hHeight = 25;
    } else this.hHeight = hHeight;
    let hWide = validateNumber(CONFIG.dockHWide, 1, 100);
    if (hWide instanceof Err) {
      warning(`getDefaultCfg: hWide: ${hWide}`);
      this.hWide = 100;
    } else this.hWide = hWide;
    let vHeight = validateNumber(CONFIG.dockVHeight, 1, 100);
    if (vHeight instanceof Err) {
      warning(`getDefaultCfg: vHeight: ${vHeight}`);
      this.vHeight = 100;
    } else this.vHeight = vHeight;
    let vWide = validateNumber(CONFIG.dockVWide, 1, 50);
    if (vWide instanceof Err) {
      warning(`getDefaultCfg: vWide: ${vWide}`);
      this.vWide = 25;
    } else this.vWide = vWide;
    // dock gaps
    let hGap = validateNumber(CONFIG.dockHGap);
    if (hGap instanceof Err) {
      warning(`getDefaultCfg: hGap: ${hGap}`);
      this.hGap = 0;
    } else this.hGap = hGap;
    let hEdgeGap = validateNumber(CONFIG.dockHEdgeGap);
    if (hEdgeGap instanceof Err) {
      warning(`getDefaultCfg: hEdgeGap: ${hEdgeGap}`);
      this.hEdgeGap = 0;
    } else this.hEdgeGap = hEdgeGap;
    let vGap = validateNumber(CONFIG.dockVGap);
    if (vGap instanceof Err) {
      warning(`getDefaultCfg: vGap: ${vGap}`);
      this.vGap = 0;
    } else this.vGap = vGap;
    let vEdgeGap = validateNumber(CONFIG.dockVEdgeGap);
    if (vEdgeGap instanceof Err) {
      warning(`getDefaultCfg: vEdgeGap: ${vEdgeGap}`);
      this.vEdgeGap = 0;
    } else this.vEdgeGap = vEdgeGap;
    // dock alignment
    let hAlignmentNumber = validateNumber(CONFIG.dockHAlignment);
    if (hAlignmentNumber instanceof Err) {
      warning(`getDefaultCfg: hAlignment: ${hAlignmentNumber}`);
      this.hAlignment = HDockAlignment.center;
    } else {
      switch (hAlignmentNumber) {
        case 0:
          this.hAlignment = HDockAlignment.center;
          break;
        case 1:
          this.hAlignment = HDockAlignment.left;
          break;
        case 2:
          this.hAlignment = HDockAlignment.right;
          break;
        default:
          warning(
            `getDefaultCfg: hAlignment:${hAlignmentNumber} is not a valid alignment`
          );
          this.hAlignment = HDockAlignment.center;
          break;
      }
    }
    let hEdgeAlignmentNumber = validateNumber(CONFIG.dockHEdgeAlignment);
    if (hEdgeAlignmentNumber instanceof Err) {
      warning(`getDefaultCfg: hEdgeAlignment: ${hEdgeAlignmentNumber}`);
      this.hEdgeAlignment = EdgeAlignment.outside;
    } else {
      switch (hEdgeAlignmentNumber) {
        case 0:
          this.hEdgeAlignment = EdgeAlignment.outside;
          break;
        case 1:
          this.hEdgeAlignment = EdgeAlignment.middle;
          break;
        case 2:
          this.hEdgeAlignment = EdgeAlignment.inside;
          break;
        default:
          warning(
            `getDefaultCfg: hEdgeAlignment:${hEdgeAlignmentNumber} is not a valid alignment`
          );
          this.hEdgeAlignment = EdgeAlignment.outside;
          break;
      }
    }

    let vAlignmentNumber = validateNumber(CONFIG.dockVAlignment);
    if (vAlignmentNumber instanceof Err) {
      warning(`getDefaultCfg: vAlignment: ${vAlignmentNumber}`);
      this.vAlignment = VDockAlignment.center;
    } else {
      switch (vAlignmentNumber) {
        case 0:
          this.vAlignment = VDockAlignment.center;
          break;
        case 1:
          this.vAlignment = VDockAlignment.top;
          break;
        case 2:
          this.vAlignment = VDockAlignment.bottom;
          break;
        default:
          warning(
            `getDefaultCfg: vAlignment: ${vAlignmentNumber} is not valid alignment`
          );
          this.vAlignment = VDockAlignment.center;
          break;
      }
    }
    let vEdgeAlignmentNumber = validateNumber(CONFIG.dockVEdgeAlignment);
    if (vEdgeAlignmentNumber instanceof Err) {
      warning(`getDefaultCfg: vEdgeAlignment: ${vEdgeAlignmentNumber}`);
      this.vEdgeAlignment = EdgeAlignment.outside;
    } else {
      switch (vEdgeAlignmentNumber) {
        case 0:
          this.vEdgeAlignment = EdgeAlignment.outside;
          break;
        case 1:
          this.vEdgeAlignment = EdgeAlignment.middle;
          break;
        case 2:
          this.vEdgeAlignment = EdgeAlignment.inside;
          break;
        default:
          warning(
            `getDefaultCfg: vEdgeAlignment:${vEdgeAlignmentNumber} is not a valid alignment`
          );
          this.vEdgeAlignment = EdgeAlignment.outside;
          break;
      }
    }
  }
  public static get instance(): DefaultDockCfg {
    if (!DefaultDockCfg._dockInstance) {
      DefaultDockCfg._dockInstance = new DefaultDockCfg();
    }

    return DefaultDockCfg._dockInstance;
  }
  public cloneAndUpdate(cfg: Partial<IDockCfg>): IDockCfg {
    return Object.assign({} as IDockCfg, DefaultDockCfg.instance, cfg);
  }
}
