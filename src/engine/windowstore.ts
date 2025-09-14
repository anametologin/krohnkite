// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class WindowStore {
  public list: WindowClass[];

  constructor(windows?: WindowClass[]) {
    this.list = windows || [];
  }

  public move(srcWin: WindowClass, destWin: WindowClass, after?: boolean) {
    const srcIdx = this.list.indexOf(srcWin);
    const destIdx = this.list.indexOf(destWin);
    if (srcIdx === -1 || destIdx === -1) return;

    this.list.splice(srcIdx, 1);
    this.list.splice(after ? destIdx + 1 : destIdx, 0, srcWin);
  }
  public moveNew(srcWin: WindowClass, destWin: WindowClass, after?: boolean) {
    const srcIdx = this.list.indexOf(srcWin);
    const destIdx = this.list.indexOf(destWin);
    if (srcIdx === -1 || destIdx === -1) return;

    if (srcIdx > destIdx) {
      this.list.splice(srcIdx, 1);
      this.list.splice(after ? destIdx + 1 : destIdx, 0, srcWin);
    } else if (destIdx > srcIdx) {
      this.list.splice(srcIdx, 1);
      this.list.splice(after ? destIdx : destIdx - 1, 0, srcWin);
    }
  }
  public getWindowById(id: string): WindowClass | null {
    let idx = this.list.map((w) => w.id).indexOf(id);
    return idx < 0 ? null : this.list[idx];
  }

  public setMaster(window: WindowClass) {
    const idx = this.list.indexOf(window);
    if (idx === -1) return;
    this.list.splice(idx, 1);
    this.list.splice(0, 0, window);
  }

  public swap(alpha: WindowClass, beta: WindowClass) {
    const alphaIndex = this.list.indexOf(alpha);
    const betaIndex = this.list.indexOf(beta);
    if (alphaIndex < 0 || betaIndex < 0) return;

    this.list[alphaIndex] = beta;
    this.list[betaIndex] = alpha;
  }

  //#region Storage Operation

  public get length(): number {
    return this.list.length;
  }

  public at(idx: number) {
    return this.list[idx];
  }

  public indexOf(window: WindowClass) {
    return this.list.indexOf(window);
  }

  public push(window: WindowClass) {
    this.list.push(window);
  }

  public beside_first(window: WindowClass) {
    this.list.splice(1, 0, window);
  }

  public remove(window: WindowClass) {
    const idx = this.list.indexOf(window);
    if (idx >= 0) this.list.splice(idx, 1);
  }

  public unshift(window: WindowClass) {
    this.list.unshift(window);
  }
  //#endregion

  //#region Querying Windows

  /** Returns all visible windows on the given surface. */
  public getVisibleWindows(srf: ISurface): WindowClass[] {
    return this.list.filter((win) => win.visible(srf));
  }

  /** Return all visible "Tile" windows on the given surface. */
  public getVisibleTiles(srf: ISurface): WindowClass[] {
    return this.list.filter((win) => win.tiled && win.visible(srf));
  }

  /**
   * Return all visible "tileable" windows on the given surface
   * @see WindowClass#tileable
   */
  public getVisibleTileables(srf: ISurface): WindowClass[] {
    return this.list.filter((win) => win.tileable && win.visible(srf));
  }

  //#endregion
}
