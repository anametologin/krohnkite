/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

type SpiralLayoutPart = HalfSplitLayoutPart<
  FillLayoutPart,
  SpiralLayoutPart | FillLayoutPart
>;

class SpiralLayout implements ILayout {
  public static readonly id = "SpiralLayout";
  public readonly description = "Spiral";
  public readonly capacity: number | null;

  public readonly classID = SpiralLayout.id;

  private depth: number;
  private parts: SpiralLayoutPart;

  constructor(capacity?: number | null) {
    this.capacity = capacity !== undefined ? capacity : null;
    this.depth = 1;
    this.parts = new HalfSplitLayoutPart(
      new FillLayoutPart(),
      new FillLayoutPart()
    );
    this.parts.angle = 0;
  }

  public adjust(
    area: Rect,
    tiles: WindowClass[],
    basis: WindowClass,
    delta: RectDelta,
    gap: number
  ): void {
    this.parts.adjust(area, tiles, basis, delta, gap);
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    tileables.forEach((tileable) => (tileable.state = WindowState.Tiled));

    this.bore(tileables.length);

    this.parts.apply(area, tileables, gap).forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }

  //handleShortcut?(ctx: EngineContext, input: Shortcut, data?: any): boolean;

  public toString(): string {
    return "Spiral()";
  }

  private bore(depth: number): void {
    if (this.depth >= depth) return;

    let hpart = this.parts;
    let i;
    for (i = 0; i < this.depth - 1; i++) {
      hpart = hpart.secondary as SpiralLayoutPart;
    }

    const lastFillPart = hpart.secondary as FillLayoutPart;
    let npart: SpiralLayoutPart;
    while (i < depth - 1) {
      npart = new HalfSplitLayoutPart(new FillLayoutPart(), lastFillPart);
      npart.angle = (((i + 1) % 4) * 90) as 0 | 90 | 180 | 270;
      hpart.secondary = npart;
      hpart = npart;
      i++;
    }
    this.depth = depth;
  }
}
