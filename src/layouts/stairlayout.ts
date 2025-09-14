// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class StairLayout implements ILayout {
  public static readonly id = "StairLayout";

  public readonly classID = StairLayout.id;
  public readonly description = "Stair";
  public readonly capacity: number | null;

  private space: number; /* in PIXELS */

  constructor(capacity?: number | null) {
    this.capacity = capacity !== undefined ? capacity : null;
    this.space = 24;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    /* Tile all tileables */
    tileables.forEach((tileable) => (tileable.state = WindowState.Tiled));
    const tiles = tileables;

    const len = tiles.length;
    const space = this.space;

    // TODO: limit the maximum number of staired windows.

    const alignRight = Number(!KWINCONFIG.stairReverse);
    for (let i = 0; i < len; i++) {
      const dx = space * (len - i - 1);
      const dy = space * i;
      tiles[i].geometry = new Rect(
        area.x + alignRight * dx,
        area.y + dy,
        area.width - dx,
        area.height - dy
      );
    }
  }

  public clone(): ILayout {
    const other = new StairLayout();
    other.space = this.space;
    return other;
  }

  public handleShortcut(ctx: EngineContext, input: Shortcut) {
    switch (input) {
      case Shortcut.Decrease:
        // TODO: define arbitrary constants
        this.space = Math.max(16, this.space - 8);
        break;
      case Shortcut.Increase:
        // TODO: define arbitrary constants
        this.space = Math.min(160, this.space + 8);
        break;
      default:
        return false;
    }
    return true;
  }

  public toString(): string {
    return "StairLayout(" + this.space + ")";
  }
}
