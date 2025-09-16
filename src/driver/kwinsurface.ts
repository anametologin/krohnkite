/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

interface ISurfaceCfg {
  capacity: number;
}
class KWinSurfaceStore implements ISurfaceStore {
  private _store: { [id: string]: ISurface };
  private _userSurfacesCfg: SurfaceCfg<ISurfaceCfg>[];
  private workspace: Workspace;

  constructor(workspace: Workspace) {
    this._store = {};
    this._userSurfacesCfg = KWinSurfaceStore.getSurfacesUserCfg();
    this.workspace = workspace;
  }

  public getSurface(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop
  ): ISurface {
    const id = KWinSurface.generateId(output, activity, vDesktop);
    if (!(id in this._store)) {
      let surfaceCfg = this._surfaceCfg(output, activity, vDesktop);
      this._store[id] = new KWinSurface(
        output,
        activity,
        vDesktop,
        this.workspace,
        surfaceCfg
      );
    } else if (this._store[id].output?.name === undefined) {
      this._store[id].output = output;
    }
    return this._store[id];
  }
  private _surfaceCfg(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop
  ): ISurfaceCfg | null {
    for (let i = 0; i < this._userSurfacesCfg.length; i++) {
      let userCfg = this._userSurfacesCfg[i];
      if (userCfg.isFit(output, activity, vDesktop)) return userCfg.cfg;
    }
    return null;
  }
  private static getSurfacesUserCfg(): SurfaceCfg<ISurfaceCfg>[] {
    let userCfg: SurfaceCfg<ISurfaceCfg>[] = [];
    getSurfacesCfg(CONFIG.surfacesDefaultConfig).forEach((srf) => {
      let validatedCfg = KWinSurfaceStore.validateUserCfg(srf.unvalidatedCfg);
      userCfg.push(
        new SurfaceCfg<ISurfaceCfg>(
          srf.outputName,
          srf.activityId,
          srf.vDesktopName,
          validatedCfg
        )
      );
    });

    return userCfg;
  }
  private static validateUserCfg(rawCfg: string[]): ISurfaceCfg {
    let errors: string[] = [];
    const cfgFields = ["cp", "capacity"];
    let surfaceCfg: ISurfaceCfg = { capacity: 99 };
    rawCfg.forEach((part) => {
      let splittedPart = part.split("=").map((p) => p.trim());
      if (splittedPart.length !== 2) {
        errors.push(`"${part}" have to has the one equal sign`);
        return;
      }
      const [userCfgField, userValue] = splittedPart;

      if (userCfgField.length === 0 || userValue.length === 0) {
        errors.push(`"${part}" can not have empty field or value`);
        return;
      }
      if (cfgFields.indexOf(userCfgField) < 0) {
        errors.push(
          `"${userCfgField}" has unknown parameter. Possible parameters: ${cfgFields.join(
            ","
          )}`
        );
        return;
      }
      let value: number | Err;
      let key: keyof ISurfaceCfg;
      switch (userCfgField) {
        case "cp":
        case "capacity":
          value = validateNumber(userValue, 1, 99);
          key = "capacity";
          break;
        default:
          errors.push(
            `"${part}" has unknown parameter. Possible parameters: ${cfgFields.join(
              ","
            )}`
          );
          return;
      }
      if (value instanceof Err) errors.push(`splittedPart[0]: ${value}`);
      else surfaceCfg[key] = value;
    });
    if (errors.length > 0) {
      warning(errors.join("\n"));
    }
    return surfaceCfg;
  }
}
class KWinSurface implements ISurface {
  private static getHash(s: string): string {
    let hash = 0;
    if (s.length == 0) return `0`;
    for (let i = 0; i < s.length; i++) {
      let charCode = s.charCodeAt(i);
      hash = (hash << 5) - hash + charCode;
      hash = hash & hash;
    }
    return `${hash}`;
  }
  public static generateId(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop,
    isLayoutId: boolean = false
  ): string {
    let path = output.name;
    if (isLayoutId) {
      if (KWINCONFIG.layoutPerActivity) path += "@" + activity;
      if (KWINCONFIG.layoutPerDesktop) path += "#" + vDesktop.id;
    } else {
      path += "@" + activity;
      path += "#" + vDesktop.id;
    }
    return KWinSurface.getHash(path);
  }

  public get workingArea(): Rect {
    const area = this._workspace.clientArea(
      ClientAreaOption.PlacementArea,
      this.output,
      this.vDesktop
    );

    return toRect(area);
  }

  public get capacity(): number | null {
    return this._capacity;
  }

  public set capacity(capacity: number | null) {
    this._capacity = capacity;
  }

  public output: Output;

  public readonly id: string;
  public readonly layoutId: string;
  public readonly ignore: boolean;
  public readonly activity: string;
  public readonly vDesktop: VirtualDesktop;

  private readonly _workspace: Workspace;
  private _capacity: number | null;

  constructor(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop,
    workspace: Workspace,
    surfaceConfig: ISurfaceCfg | null
  ) {
    this.id = KWinSurface.generateId(output, activity, vDesktop);
    this.layoutId = KWinSurface.generateId(output, activity, vDesktop, true);
    this.ignore =
      KWINCONFIG.ignoreActivity.indexOf(activity) >= 0 ||
      KWINCONFIG.ignoreScreen.indexOf(output.name) >= 0 ||
      KWINCONFIG.ignoreVDesktop.indexOf(vDesktop.name) >= 0;

    this.output = output;
    this.activity = activity;
    this.vDesktop = vDesktop;
    this._workspace = workspace;
    this._capacity = surfaceConfig !== null ? surfaceConfig.capacity : null;
  }

  public getParams(): [string, string, string] {
    return [this.output.name, this.activity, this.vDesktop.name];
  }

  public next(): ISurface | null {
    // TODO: ... thinking about this function
    return null;
    // old: workspace.desktops => int number of virtual desktops. now all desktops objects where window is on and empty list if window on all desktops.
    //if (this.desktop === workspace.desktops)
    /* this is the last virtual desktop */
    /* TODO: option to create additional desktop */
    // return null;

    //return new KWinSurface(this.output, this.activity, this.desktop + 1);
  }

  public toString(): string {
    return (
      "KWinSurface(" +
      [this.output.name, this.activity, this.vDesktop.name].join(", ") +
      ")"
    );
  }
}
