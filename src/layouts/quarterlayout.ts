/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class QuarterLayout implements ILayout {
  public static readonly MAX_PROPORTION = 0.8;
  public static readonly id = "QuarterLayout";

  public readonly classID = QuarterLayout.id;
  public readonly description = "Quarter";

  public get capacity(): number {
    return 4;
  }

  private lhsplit: number;
  private rhsplit: number;
  private vsplit: number;

  // Store splits per surface (output:activity:vDesktop) so resized windows persist per-screen/desktop
  private splitMap: Map<string, { lhs: number; rhs: number; v: number }> = new Map();

  // Helper: compute surface key from a WindowClass (basis) or EngineContext (ctx)
  private surfaceKeyFrom(basis?: WindowClass, ctx?: EngineContext): string {
    try {
      if (basis && (basis as any).surface) {
        const s = (basis as any).surface;
        return `${s.output.name}:${s.activity}:${s.vDesktop.name}`;
      }
    } catch (e) { }
    try {
      if (ctx && (ctx as any).surfaceParams) {
        const params = (ctx as any).surfaceParams;
        if (Array.isArray(params) && params.length >= 3)
          return `${params[0]}:${params[1]}:${params[2]}`;
        return String(params);
      }
    } catch (e) { }
    return "global";
  }

  // Get or create splits for a given surface key
  private getSplitsFor(key: string) {
    let o = this.splitMap.get(key);
    if (!o) {
      o = { lhs: 0.5, rhs: 0.5, v: 0.5 };
      this.splitMap.set(key, o);
    }
    return o;
  }

  // Track previous tile count per-surface to avoid unintended resets when focus changes
  private prevTileCountMap: Map<string, number> = new Map();

  public constructor() {
    this.lhsplit = 0.5;
    this.rhsplit = 0.5;
    this.vsplit = 0.5;
    // initialize default global splits
    this.splitMap.set('global', { lhs: 0.5, rhs: 0.5, v: 0.5 });
  }

  // Resets the splits to their default values for the current surface (or globally if none provided).
  private resetSplits(key?: string): void {
    if (key) {
      this.splitMap.set(key, { lhs: 0.5, rhs: 0.5, v: 0.5 });
    } else {
      // fallback: clear all
      this.splitMap.clear();
    }
  }

  public adjust(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number
  ) {
    // Use per-surface splits (output:activity:vDesktop) derived from the basis window
    const skey = this.surfaceKeyFrom(basis);
    const splits = this.getSplitsFor(skey);
    let lhs = splits.lhs;
    let rhs = splits.rhs;
    let v = splits.v;

    if (tiles.length <= 1 || tiles.length > 4) return;

    const idx = tiles.indexOf(basis);
    if (idx < 0) return;

    /* vertical split */
    if ((idx === 0 || idx === 3) && delta.east !== 0)
      v = (area.width * v + delta.east) / area.width;
    else if ((idx === 1 || idx === 2) && delta.west !== 0)
      v = (area.width * v - delta.west) / area.width;

    /* horizontal split */
    if (tiles.length === 2) {
      if (idx === 0 && delta.south !== 0)
        lhs = (area.height * lhs + delta.south) / area.height;
      if (idx === 1 && delta.north !== 0)
        lhs = (area.height * lhs - delta.north) / area.height;
    } else if (tiles.length === 3) {
      if (idx === 0 && delta.south !== 0)
        lhs = (area.height * lhs + delta.south) / area.height;
      if (idx === 2 && delta.north !== 0)
        rhs = (area.height * rhs - delta.north) / area.height;
    } else {
      /* tiles.length === 4 */
      if (idx === 0 && delta.south !== 0)
        lhs = (area.height * lhs + delta.south) / area.height;
      if (idx === 3 && delta.north !== 0)
        lhs = (area.height * lhs - delta.north) / area.height;
      if (idx === 1 && delta.south !== 0)
        rhs = (area.height * rhs + delta.south) / area.height;
      if (idx === 2 && delta.north !== 0)
        rhs = (area.height * rhs - delta.north) / area.height;
    }

    /* clipping */
    v = clip(
      v,
      1 - QuarterLayout.MAX_PROPORTION,
      QuarterLayout.MAX_PROPORTION
    );
    lhs = clip(
      lhs,
      1 - QuarterLayout.MAX_PROPORTION,
      QuarterLayout.MAX_PROPORTION
    );
    rhs = clip(
      rhs,
      1 - QuarterLayout.MAX_PROPORTION,
      QuarterLayout.MAX_PROPORTION
    );

    // persist splits for this surface
    splits.lhs = lhs;
    splits.rhs = rhs;
    splits.v = v;
  }

  public clone(): ILayout {
    const other = new QuarterLayout();

    // copy per-surface split map
    for (const [k, v] of this.splitMap) {
      other.splitMap.set(k, { lhs: v.lhs, rhs: v.rhs, v: v.v });
    }

    // copy per-surface previous tile counts
    for (const [k, n] of this.prevTileCountMap) {
      other.prevTileCountMap.set(k, n);
    }

    return other;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    // Prefer EngineContext surfaceParams for a stable surface key (avoid relying on tileables[0] order).
    const skey = this.surfaceKeyFrom(undefined, ctx);
    let splits = this.getSplitsFor(skey);

    if (CONFIG.quarterLayoutReset) {
      // Reset splits if a window was closed (i.e. tile count decreased) for this surface only
      const prev = this.prevTileCountMap.get(skey) ?? tileables.length;
      if (prev > 0 && prev > tileables.length) {
        this.resetSplits(skey);
        // re-read splits so the newly-reset values take effect immediately
        splits = this.getSplitsFor(skey);
      }
      this.prevTileCountMap.set(skey, tileables.length);
    }

    if (tileables.length === 0) return;

    const gap1 = gap / 2;
    const gap2 = gap - gap1;

    const leftWidth = area.width * splits.v;
    const rightWidth = area.width - leftWidth;
    const rightX = area.x + leftWidth;
    if (tileables.length === 1) {
      tileables[0].geometry = new Rect(
        area.x,
        area.y,
        area.width,
        area.height
      ).gap(0, 0, 0, 0);
      return;
    }

    if (tileables.length === 2) {
      tileables[0].geometry = new Rect(
        area.x,
        area.y,
        leftWidth,
        area.height
      ).gap(0, gap1, 0, 0);
      tileables[1].geometry = new Rect(
        rightX,
        area.y,
        rightWidth,
        area.height
      ).gap(gap2, 0, 0, 0);
      return;
    }

    const rightTopHeight = area.height * splits.rhs;
    const rightBottomHeight = area.height - rightTopHeight;
    const rightBottomY = area.y + rightTopHeight;
    if (tileables.length === 3) {
      tileables[0].geometry = new Rect(
        area.x,
        area.y,
        leftWidth,
        area.height
      ).gap(0, gap1, 0, 0);
      tileables[1].geometry = new Rect(
        rightX,
        area.y,
        rightWidth,
        rightTopHeight
      ).gap(gap2, 0, 0, gap1);
      tileables[2].geometry = new Rect(
        rightX,
        rightBottomY,
        rightWidth,
        rightBottomHeight
      ).gap(gap2, 0, gap2, 0);
      return;
    }

    const leftTopHeight = area.height * splits.lhs;
    const leftBottomHeight = area.height - leftTopHeight;
    const leftBottomY = area.y + leftTopHeight;

    /* 4 tiles */
    if (tileables.length === 4) {
      tileables[0].geometry = new Rect(
        area.x,
        area.y,
        leftWidth,
        leftTopHeight
      ).gap(0, gap1, 0, gap1);
      tileables[1].geometry = new Rect(
        rightX,
        area.y,
        rightWidth,
        rightTopHeight
      ).gap(gap2, 0, 0, gap1);
      tileables[2].geometry = new Rect(
        rightX,
        rightBottomY,
        rightWidth,
        rightBottomHeight
      ).gap(gap2, 0, gap2, 0);
      tileables[3].geometry = new Rect(
        area.x,
        leftBottomY,
        leftWidth,
        leftBottomHeight
      ).gap(0, gap2, gap2, 0);
    }
  }

  public toString(): string {
    return "QuarterLayout()";
  }
}

