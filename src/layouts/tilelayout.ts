// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

class TileLayout implements ILayout {
  public static readonly MIN_MASTER_RATIO = 0.2;
  public static readonly MAX_MASTER_RATIO = 0.8;
  public static readonly id = "TileLayout";

  public readonly classID = TileLayout.id;

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

  constructor() {
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
