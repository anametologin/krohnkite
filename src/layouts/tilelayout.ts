/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class TileLayout implements ILayout {
  public static readonly MIN_MASTER_RATIO = 0.2;
  public static readonly MAX_MASTER_RATIO = 0.8;
  public static readonly id = "TileLayout";

  public readonly classID = TileLayout.id;
  public readonly capacity?: number | null;

  public get description(): string {
    return "Tile [" + this.numMaster + "]";
  }

  private parts: RotateLayoutPart<
    HalfSplitLayoutPart<RotateLayoutPart<StackLayoutPart>, StackLayoutPart>
  >;

  private get numMaster(): number {
    return this.parts.inner.primarySize;
  }

  private set numMaster(value: number) {
    this.parts.inner.primarySize = value;
  }

  private get masterRatio(): number {
    return this.parts.inner.ratio;
  }

  private set masterRatio(value: number) {
    this.parts.inner.ratio = value;
  }

  constructor(capacity?: number | null) {
    this.capacity = capacity !== undefined ? capacity : null;
    this.parts = new RotateLayoutPart(
      new HalfSplitLayoutPart(
        new RotateLayoutPart(new StackLayoutPart()),
        new StackLayoutPart()
      )
    );
    switch (CONFIG.tileLayoutInitialAngle) {
      case "1": {
        this.parts.angle = 90;
        break;
      }
      case "2": {
        this.parts.angle = 180;
        break;
      }
      case "3": {
        this.parts.angle = 270;
        break;
      }
    }
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

    this.parts.apply(area, tileables, gap).forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }

  public clone(): ILayout {
    const other = new TileLayout();
    other.masterRatio = this.masterRatio;
    other.numMaster = this.numMaster;
    return other;
  }

  public handleShortcut(ctx: EngineContext, input: Shortcut) {
    switch (input) {
      case Shortcut.DWMLeft:
        this.masterRatio = clip(
          slide(this.masterRatio, -0.05),
          TileLayout.MIN_MASTER_RATIO,
          TileLayout.MAX_MASTER_RATIO
        );
        break;
      case Shortcut.DWMRight:
        this.masterRatio = clip(
          slide(this.masterRatio, +0.05),
          TileLayout.MIN_MASTER_RATIO,
          TileLayout.MAX_MASTER_RATIO
        );
        break;
      case Shortcut.Increase:
        // TODO: define arbitrary constant
        if (this.numMaster < 10) this.numMaster += 1;
        ctx.showNotification(this.description);
        break;
      case Shortcut.Decrease:
        if (this.numMaster > 0) this.numMaster -= 1;
        ctx.showNotification(this.description);
        break;
      case Shortcut.Rotate:
        this.parts.rotate(90);
        break;
      case Shortcut.RotatePart:
        this.parts.inner.primary.rotate(90);
        break;
      default:
        return false;
    }
    return true;
  }

  public toString(): string {
    return (
      "TileLayout(nmaster=" +
      this.numMaster +
      ", ratio=" +
      this.masterRatio +
      ")"
    );
  }
}
