// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

function parseDockUserSurfacesCfg(): SurfaceCfg<IDockCfg>[] {
  //format: "OuputName:ActivityId:VirtualDesktopName:shortname=value,shortname=value..."
  let surfacesCfg: SurfaceCfg<IDockCfg>[] = [];
  getSurfacesCfg(CONFIG.dockSurfacesConfig).forEach((srf) => {
    let partialDockCfg = parseSplittedUserCfg(srf.unvalidatedCfg);
    if (partialDockCfg instanceof Err) {
      warning(`Invalid User surface config: ${srf}. ${partialDockCfg}`);
      return;
    }
    if (Object.keys(partialDockCfg).length > 0) {
      surfacesCfg.push(
        new SurfaceCfg<IDockCfg>(
          srf.outputName,
          srf.activityId,
          srf.vDesktopName,
          DefaultDockCfg.instance.cloneAndUpdate(partialDockCfg) as IDockCfg
        )
      );
    }
  });
  return surfacesCfg;
}

function parseDockUserWindowClassesCfg(): {
  [windowClassName: string]: IDock;
} {
  //format: "WindowClass:<special flags>:shortname=value,shortname=value..."
  let userWindowClassesCfg: { [windowClassName: string]: IDock } = {};
  if (CONFIG.dockWindowClassConfig.length === 0) return userWindowClassesCfg;
  CONFIG.dockWindowClassConfig.forEach((cfg) => {
    let windowCfgString = cfg.split(":").map((part) => part.trim());
    if (windowCfgString.length !== 3) {
      warning(`Invalid window class config: "${cfg}" should have two colons`);
      return;
    }
    let splittedUserCfg = windowCfgString[2]
      .split(",")
      .map((part) => part.trim().toLowerCase());
    let partialDockCfg: Partial<IDockCfg> | Err;
    if (splittedUserCfg[0] !== "") {
      partialDockCfg = parseSplittedUserCfg(splittedUserCfg);
      if (partialDockCfg instanceof Err) {
        warning(`Invalid User window class config: ${cfg}. ${partialDockCfg}`);
        return;
      }
    } else partialDockCfg = {};
    let splittedSpecialFlags = windowCfgString[1]
      .split(",")
      .map((part) => part.trim().toLowerCase());
    let dock = parseSpecialFlags(splittedSpecialFlags, partialDockCfg);
    if (dock instanceof Err) {
      warning(`Invalid User window class config: ${cfg}. ${dock}`);
      return;
    }
    userWindowClassesCfg[windowCfgString[0]] = dock;
  });
  return userWindowClassesCfg;
}

function parseSpecialFlags(
  splittedSpecialFlags: string[],
  partialDockCfg: Partial<IDockCfg>
): IDock {
  let dock = new Dock(DefaultDockCfg.instance.cloneAndUpdate(partialDockCfg));
  splittedSpecialFlags.forEach((flag) => {
    switch (flag) {
      case "auto":
      case "a":
        dock.autoDock = true;
        break;
      case "pin":
      case "p":
        dock.priority = 5;
        break;
      case "left":
      case "l":
        dock.position = DockPosition.left;
        break;
      case "right":
      case "r":
        dock.position = DockPosition.right;
        break;
      case "top":
      case "t":
        dock.position = DockPosition.top;
        break;
      case "bottom":
      case "b":
        dock.position = DockPosition.bottom;
        break;
      default:
        warning(
          `parse Special Flags: ${splittedSpecialFlags}.Unknown special flag: ${flag}`
        );
    }
  });
  return dock;
}

function parseSplittedUserCfg(
  splittedUserCfg: string[]
): Partial<IDockCfg> | Err {
  let errors: string[] = [];
  const shortNames: { [shortName: string]: keyof IDockCfg } = {
    hh: "hHeight",
    hw: "hWide",
    hgv: "hEdgeGap",
    hgh: "hGap",
    ha: "hAlignment",
    he: "hEdgeAlignment",
    vh: "vHeight",
    vw: "vWide",
    vgh: "vEdgeGap",
    vgv: "vGap",
    ve: "vEdgeAlignment",
    va: "vAlignment",
  };
  let dockCfg: {
    [dockCfgField: string]:
      | number
      | VDockAlignment
      | HDockAlignment
      | EdgeAlignment;
  } = {};
  splittedUserCfg.forEach((part) => {
    let splittedPart = part.split("=").map((part) => part.trim());
    if (splittedPart.length !== 2) {
      errors.push(`"${part}" can have only one equal sign`);
      return;
    }
    if (splittedPart[0].length === 0 || splittedPart[1].length === 0) {
      errors.push(`"${part}" can not have empty shortname or value`);
      return;
    }
    if (shortNames[splittedPart[0]] in dockCfg) {
      errors.push(`"${part}" has duplicate shortname`);
      return;
    }
    if (!(splittedPart[0] in shortNames)) {
      errors.push(`"${part}" has unknown shortname`);
      return;
    }
    if (["he", "ve"].indexOf(splittedPart[0]) >= 0) {
      switch (splittedPart[1]) {
        case "outside":
        case "o":
        case "0":
          dockCfg[shortNames[splittedPart[0]]] = EdgeAlignment.outside;
          break;
        case "middle":
        case "m":
        case "1":
          dockCfg[shortNames[splittedPart[0]]] = EdgeAlignment.middle;
          break;
        case "inside":
        case "i":
        case "2":
          dockCfg[shortNames[splittedPart[0]]] = EdgeAlignment.inside;
          break;
        default:
          errors.push(
            ` "${part}" value can be o,m or i or output,middle,input or 0,1,2`
          );
          return;
      }
    } else if (splittedPart[0] === "va") {
      switch (splittedPart[1]) {
        case "center":
        case "c":
        case "0":
          dockCfg[shortNames[splittedPart[0]]] = VDockAlignment.center;
          break;
        case "1":
        case "top":
        case "t":
          dockCfg[shortNames[splittedPart[0]]] = VDockAlignment.top;
          break;
        case "2":
        case "bottom":
        case "b":
          dockCfg[shortNames[splittedPart[0]]] = VDockAlignment.bottom;
          break;
        default:
          errors.push(
            ` "${part}" value can be c,t or b or center,top,bottom or 0,1,2`
          );
          return;
      }
    } else if (splittedPart[0] === "ha") {
      switch (splittedPart[1]) {
        case "center":
        case "c":
        case "0":
          dockCfg[shortNames[splittedPart[0]]] = HDockAlignment.center;
          break;
        case "1":
        case "left":
        case "l":
          dockCfg[shortNames[splittedPart[0]]] = HDockAlignment.left;
          break;
        case "2":
        case "right":
        case "r":
          dockCfg[shortNames[splittedPart[0]]] = HDockAlignment.right;
          break;
        default:
          errors.push(
            `"${part}" value can be c,l or r or center,left,right or 0,1,2`
          );
          return;
      }
    } else {
      let value: number | Err;
      switch (splittedPart[0]) {
        case "hw":
        case "vh":
          value = validateNumber(splittedPart[1], 1, 100);
          break;
        case "hh":
        case "vw":
          value = validateNumber(splittedPart[1], 1, 50);
          break;
        case "hgh":
        case "vgv":
        case "vgh":
        case "vgv":
          value = validateNumber(splittedPart[1]);
          break;
        default:
          errors.push(`unknown shortname ${splittedPart[0]}`);
          return;
      }
      if (value instanceof Err) errors.push(`splittedPart[0]: ${value}`);
      else dockCfg[shortNames[splittedPart[0]]] = value;
    }
  });
  if (errors.length > 0) {
    return new Err(errors.join("\n"));
  }
  return dockCfg as Partial<IDockCfg>;
}
