// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class FloatingLayout implements ILayout {
  public static readonly id = "FloatingLayout ";
  public static instance = new FloatingLayout();

  public readonly classID = FloatingLayout.id;
  public readonly description: string = "Floating";

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    tileables.forEach(
      (tileable: WindowClass) => (tileable.state = WindowState.TiledAfloat)
    );
  }

  public clone(): this {
    /* fake clone */
    return this;
  }

  public toString(): string {
    return "FloatingLayout()";
  }
}
