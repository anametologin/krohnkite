/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class FloatingLayout implements ILayout {
  public static readonly id = "FloatingLayout";
  public static instance = new FloatingLayout();

  public readonly classID = FloatingLayout.id;
  public readonly description: string = "Floating";

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number,
  ): void {
    tileables.forEach(
      (tileable: WindowClass) => (tileable.state = WindowState.TiledAfloat),
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
