/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class LayoutStoreEntry {
  public get currentLayout(): ILayout {
    return this.loadLayout(this.currentID);
  }

  private currentIndex: number | null;
  private currentID: string;
  private layouts: { [key: string]: ILayout };
  private previousID: string;

  constructor(outputName: string, desktopName?: string, activity?: string) {
    let layouts = CONFIG.layoutOrder.map((layout) => layout.toLowerCase());
    let layouts_str = layouts.map((layout, i) => i + "." + layout + " ");
    print(
      `Krohnkite: Screen(output):${outputName}, Desktop(name):${desktopName}, Activity: ${activity}, layouts: ${layouts_str}`
    );
    this.currentIndex = 0;
    this.currentID = CONFIG.layoutOrder[0];

    CONFIG.screenDefaultLayout.some((entry) => {
      let cfg = entry.split(":");
      const cfgLength = cfg.length;
      if (cfgLength < 2 && cfgLength > 4) return false;
      let cfgOutput = cfg[0];
      let cfgActivity = "";
      let cfgVDesktop = "";
      let cfgLayout = undefined;
      if (cfgLength === 2) {
        cfgLayout = cfg[1];
      } else if (cfgLength === 3) {
        cfgVDesktop = cfg[1];
        cfgLayout = cfg[2];
      } else if (cfgLength === 4) {
        cfgActivity = cfg[1];
        cfgVDesktop = cfg[2];
        cfgLayout = cfg[3];
      }
      if (cfgLayout === undefined) return false;
      // let cfg_desktop = cfg.length > 2 ? undefined : cfg[1];
      let cfgLayoutId = parseInt(cfgLayout);
      if (isNaN(cfgLayoutId)) {
        cfgLayoutId = layouts.indexOf(cfgLayout.toLowerCase());
        cfgLayoutId =
          cfgLayoutId >= 0
            ? cfgLayoutId
            : layouts.indexOf(cfgLayout.toLowerCase() + "layout");
      }
      if (
        (outputName === cfgOutput || cfgOutput === "") &&
        (desktopName === cfgVDesktop || cfgVDesktop === "") &&
        (activity === cfgActivity || cfgActivity === "") &&
        cfgLayoutId >= 0 &&
        cfgLayoutId < CONFIG.layoutOrder.length
      ) {
        this.currentIndex = cfgLayoutId;
        this.currentID = CONFIG.layoutOrder[this.currentIndex];
        return true;
      }
    });

    this.layouts = {};
    this.previousID = this.currentID;

    this.loadLayout(this.currentID);
  }

  public cycleLayout(step: -1 | 1): ILayout {
    this.previousID = this.currentID;
    this.currentIndex =
      this.currentIndex !== null
        ? wrapIndex(this.currentIndex + step, CONFIG.layoutOrder.length)
        : 0;
    this.currentID = CONFIG.layoutOrder[this.currentIndex];
    return this.loadLayout(this.currentID);
  }

  public setLayout(targetID: string): ILayout {
    let targetLayout = this.loadLayout(targetID);
    if (
      targetLayout instanceof MonocleLayout &&
      this.currentLayout instanceof MonocleLayout
    ) {
      /* toggle Monocle "OFF" */
      this.currentID = this.previousID;
      this.previousID = targetID;
      targetLayout = this.loadLayout(this.currentID);
    } else if (this.currentID !== targetID) {
      this.previousID = this.currentID;
      this.currentID = targetID;
    }

    this.updateCurrentIndex();
    return targetLayout;
  }

  private updateCurrentIndex(): void {
    const idx = CONFIG.layoutOrder.indexOf(this.currentID);
    this.currentIndex = idx === -1 ? null : idx;
  }

  private loadLayout(ID: string): ILayout {
    let layout = this.layouts[ID];
    if (!layout) layout = this.layouts[ID] = CONFIG.layoutFactories[ID]();
    return layout;
  }
}

class LayoutStore {
  private store: { [key: string]: LayoutStoreEntry };

  constructor() {
    this.store = {};
  }

  public getCurrentLayout(srf: ISurface): ILayout {
    return srf.ignore
      ? FloatingLayout.instance
      : this.getEntry(srf).currentLayout;
  }

  public cycleLayout(srf: ISurface, step: 1 | -1): ILayout | null {
    if (srf.ignore) return null;
    return this.getEntry(srf).cycleLayout(step);
  }

  public setLayout(srf: ISurface, layoutClassID: string): ILayout | null {
    if (srf.ignore) return null;
    return this.getEntry(srf).setLayout(layoutClassID);
  }

  private getEntry(srf: ISurface): LayoutStoreEntry {
    if (!this.store[srf.id]) {
      // check if this surface but without activity already constructed.
      // surface create after desktop and constructor ran twice
      let key_without_activity = KWinSurface.generateId(
        srf.output,
        "",
        srf.vDesktop
      );
      if (this.store[key_without_activity]) {
        this.store[srf.id] = this.store[key_without_activity];
        delete this.store[key_without_activity];
      } else {
        this.store[srf.id] = new LayoutStoreEntry(
          srf.output.name,
          srf.vDesktop.name,
          srf.activity
        );
      }
    }
    return this.store[srf.id];
  }
}
