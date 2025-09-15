/*
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

type positionType = "single" | "left" | "middle" | "right";

class ColumnLayout implements ILayout {
  public static readonly id = "Column";
  public readonly classID = ColumnLayout.id;
  public position: positionType;
  public windowIds: Set<string>;
  public renderedWindowsIds: Array<string>;
  public renderedWindowsRects: Array<Rect>;
  public weight: number;
  public timestamp: number;
  private parts: RotateLayoutPart<StackLayoutPart>;
  private numberFloatedOrMinimized: number;

  public get description(): string {
    return "Column";
  }

  public toString(): string {
    let s: string = `ColumnLayout${this.windowIds.size}:`;
    this.windowIds.forEach((id) => (s = s + id + ","));
    return s;
  }

  constructor() {
    this.position = "single";
    this.weight = 1.0;
    this.parts = new RotateLayoutPart(new StackLayoutPart());
    this.windowIds = new Set();
    this.renderedWindowsIds = [];
    this.renderedWindowsRects = [];
    this.numberFloatedOrMinimized = 0;
    this.timestamp = 0;
  }

  public get size(): number {
    return this.windowIds.size - this.numberFloatedOrMinimized;
  }

  public set isHorizontal(value: boolean) {
    if (value) this.parts.angle = 270;
    else this.parts.angle = 0;
  }

  public isEmpty(): boolean {
    return this.windowIds.size === this.numberFloatedOrMinimized;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    this.renderedWindowsIds = [];
    let columnTileables = tileables.filter((w) => {
      if (this.windowIds.has(w.id)) {
        this.renderedWindowsIds.push(w.id);
        return true;
      }
    });
    this.renderedWindowsRects = [];
    this.parts.apply(area, columnTileables, gap).forEach((geometry, i) => {
      columnTileables[i].geometry = geometry;
      this.renderedWindowsRects.push(geometry);
    });
  }

  public getUpperWindowId(id: string): string | null {
    let winId = this.renderedWindowsIds.indexOf(id);
    if (winId < 1) return null;
    return this.renderedWindowsIds[winId - 1];
  }

  public getLowerWindowId(id: string): string | null {
    let winId = this.renderedWindowsIds.indexOf(id);
    if (winId < 0 || winId === this.renderedWindowsIds.length - 1) return null;
    return this.renderedWindowsIds[winId + 1];
  }

  public getWindowIdOnRight(x: number): string | null {
    for (let i = 0; i < this.renderedWindowsIds.length; i++) {
      if (x < this.renderedWindowsRects[i].center[0] + 10)
        return this.renderedWindowsIds[i];
    }
    return null;
  }
  public getWindowIdOnTop(y: number): string | null {
    for (let i = 0; i < this.renderedWindowsIds.length; i++) {
      if (y < this.renderedWindowsRects[i].center[1] + 10)
        return this.renderedWindowsIds[i];
    }
    return null;
  }

  public adjust(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number
  ) {
    let columnTiles = tiles.filter((t) => this.windowIds.has(t.id));
    this.parts.adjust(area, columnTiles, basis, delta, gap);
  }

  public actualizeWindowIds(ctx: EngineContext, ids: Set<string>) {
    let window: WindowClass | null;
    let floatedOrMinimized: number = 0;
    // Sets intersection
    this.windowIds = new Set(
      [...this.windowIds].filter((id) => {
        window = ctx.getWindowById(id);
        if (ids.has(id)) return true;
        else if (window !== null && (window.minimized || window.floating)) {
          floatedOrMinimized += 1;
          return true;
        }
        return false;
      })
    );
    this.numberFloatedOrMinimized = floatedOrMinimized;
  }
}
