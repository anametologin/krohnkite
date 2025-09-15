/*
    SPDX-FileCopyrightText: 2024 Jas Singh <singh.jaskir@outlook.com>

    SPDX-License-Identifier: MIT
*/

class StackedLayout implements ILayout {
  public static readonly id = "StackedLayout";

  public readonly classID = StackedLayout.id;
  public readonly capacity: number | null;

  public get description(): string {
    return "Stacked";
  }

  private parts: RotateLayoutPart<
    HalfSplitLayoutPart<StackLayoutPart, StackLayoutPart>
  >;

  constructor(capacity?: number | null) {
    this.capacity = capacity !== undefined ? capacity : null;
    this.parts = new RotateLayoutPart(
      new HalfSplitLayoutPart(new StackLayoutPart(), new StackLayoutPart())
    );
  }

  public adjust(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number
  ) {
    this.parts.adjust(area, tiles, basis, delta, gap);
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    tileables.forEach((tileable) => (tileable.state = WindowState.Tiled));

    if (tileables.length > 1) {
      this.parts.inner.angle = 90;
    }

    this.parts.apply(area, tileables, gap).forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }

  public clone(): ILayout {
    const other = new StackedLayout();
    return other;
  }

  public handleShortcut(ctx: EngineContext, input: Shortcut) {
    switch (input) {
      case Shortcut.Rotate:
        this.parts.rotate(90);
        break;
      default:
        return false;
    }
    return true;
  }

  public toString(): string {
    return "StackedLayout()";
  }
}
