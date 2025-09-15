/*
    SPDX-FileCopyrightText: 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class DockStore implements IDockStore {
  private store: { [SurfaceId: string]: DockEntry };
  private defaultCfg: DefaultDockCfg | null;
  private surfacesCfg: SurfaceCfg<IDockCfg>[];
  private windowClassesCfg: { [windowClassName: string]: IDock };

  constructor() {
    this.store = {};
    this.defaultCfg = null;
    this.surfacesCfg = [];
    this.windowClassesCfg = {};
  }

  public render(
    srf: ISurface,
    visibles: WindowClass[],
    workingArea: Rect
  ): Rect {
    if (this.defaultCfg === null) {
      this.defaultCfg = DefaultDockCfg.instance;
      this.surfacesCfg = parseDockUserSurfacesCfg();
      this.windowClassesCfg = parseDockUserWindowClassesCfg();
    }
    if (!this.store[srf.id]) {
      this.store[srf.id] = new DockEntry(this.getSurfaceCfg(srf), srf.id);
    }
    let dockedWindows = visibles.filter((w) => {
      if (w.state === WindowState.Docked) {
        if (w.dock === null && w.windowClassName in this.windowClassesCfg) {
          w.dock = this.windowClassesCfg[w.windowClassName].clone();
        }
        return true;
      }
    });
    if (dockedWindows.length === 0) return workingArea;

    return this.store[srf.id].arrange(dockedWindows, workingArea);
  }

  public remove(window: WindowClass) {
    for (let key in this.store) {
      this.store[key].remove(window);
    }
  }

  public handleShortcut(
    ctx: IDriverContext,
    window: WindowClass,
    shortcut: Shortcut
  ): boolean {
    switch (shortcut) {
      case Shortcut.SwapLeft:
      case Shortcut.SwapUp:
      case Shortcut.SwapRight:
      case Shortcut.SwapDown:
        const srf = ctx.currentSurface;
        if (this.store[srf.id]) {
          return this.store[srf.id].handleShortcut(window, shortcut);
        }
        return false;
      default:
        return false;
    }
  }

  public isNewWindowHaveDocked(window: WindowClass): boolean {
    if (
      window.windowClassName in this.windowClassesCfg &&
      this.windowClassesCfg[window.windowClassName].autoDock === true
    )
      return true;
    return false;
  }

  private getSurfaceCfg(srf: ISurface): SurfaceCfg<IDockCfg> {
    let dockCfg: IDockCfg | null = null;
    for (let surfaceCfg of this.surfacesCfg) {
      if (surfaceCfg.isFit(srf.output, srf.activity, srf.vDesktop)) {
        dockCfg = { ...surfaceCfg.cfg };
        break;
      }
    }
    if (dockCfg === null) dockCfg = this.defaultCfg!.cloneAndUpdate({});
    let [outputName, activityId, vDesktopName] = srf.getParams();

    return new SurfaceCfg<IDockCfg>(
      outputName,
      activityId,
      vDesktopName,
      dockCfg
    );
  }
}
