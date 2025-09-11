// Copyright (c) 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
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

type BTreeLayoutPart = HalfSplitLayoutPart<
  BTreeLayoutPart | FillLayoutPart,
  BTreeLayoutPart | FillLayoutPart
>;

class BinaryTreeLayout implements ILayout {
  public static readonly id = "BinaryTreeLayout";

  public readonly classID = BinaryTreeLayout.id;
  public readonly capacity?: number | null;

  public get description(): string {
    return "BTree";
  }

  private parts: BTreeLayoutPart;

  constructor(capacity?: number | null) {
    this.capacity = capacity !== undefined ? capacity : null;
    this.parts = new HalfSplitLayoutPart(
      new FillLayoutPart(),
      new FillLayoutPart()
    );
    this.parts.angle = 0;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    tileables.forEach((tileable) => (tileable.state = WindowState.Tiled));
    this.create_parts(tileables.length);
    let rectangles = this.parts.apply(area, tileables, gap);
    rectangles.forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }
  private create_parts(tiles_len: number): void {
    let head = this.get_head();
    head.angle = 0;
    if (tiles_len > 2) {
      // es5 has not the log2 function, so I use natural log
      let level = Math.ceil(Math.log(tiles_len) * 1.442695);
      let level_capacity = 2 ** (level - 1);
      let half_level_capacity = 2 ** (level - 2);

      if (tiles_len > level_capacity + half_level_capacity) {
        head.primarySize = tiles_len - level_capacity;
      } else {
        head.primarySize = half_level_capacity;
      }
      this.build_binary_tree(head, level, 2, tiles_len);
    }
    this.parts = head;
  }

  private build_binary_tree(
    head: BTreeLayoutPart,
    max_level: number,
    current_level: number,
    tiles_len: number
  ): void {
    if (current_level <= max_level) {
      if (head.primarySize > 1) {
        let primary = this.get_head();
        primary.primarySize = Math.floor(head.primarySize / 2);
        primary.angle = current_level % 2 ? 0 : 90;
        head.primary = primary;
        this.build_binary_tree(
          primary,
          max_level,
          current_level + 1,
          head.primarySize
        );
      }
      if (tiles_len - head.primarySize > 1) {
        let secondary = this.get_head();
        secondary.primarySize = Math.floor((tiles_len - head.primarySize) / 2);
        secondary.angle = current_level % 2 ? 0 : 90;
        head.secondary = secondary;
        this.build_binary_tree(
          secondary,
          max_level,
          current_level + 1,
          tiles_len - head.primarySize
        );
      }
    }
  }

  private get_head(): HalfSplitLayoutPart<FillLayoutPart, FillLayoutPart> {
    return new HalfSplitLayoutPart(new FillLayoutPart(), new FillLayoutPart());
  }

  public clone(): ILayout {
    const other = new StackedLayout();
    return other;
  }

  public toString(): string {
    return "BTreeLayout()";
  }
}
