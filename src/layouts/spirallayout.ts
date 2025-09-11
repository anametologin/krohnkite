// Copyright (c) 2018-2020 Eon S. Jeon <esjeon@hyunmu.am>
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
