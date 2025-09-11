// Copyright (c) 2024 Jas Singh <singh.jaskir@outlook.com>
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
