/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

/**
 * Describes geometric changes of a rectangle, in terms of changes per edge.
 * Outward changes are in positive, and inward changes are in negative.
 */

class RectDelta {
  /** Generate a delta that transforms basis to target. */
  public static fromRects(basis: Rect, target: Rect): RectDelta {
    const diff = target.subtract(basis);
    return new RectDelta(
      diff.width + diff.x,
      -diff.x,
      diff.height + diff.y,
      -diff.y
    );
  }

  constructor(
    public readonly east: number,
    public readonly west: number,
    public readonly south: number,
    public readonly north: number
  ) {}

  public toString(): string {
    return (
      "WindowResizeDelta(" +
      [
        "east=" + this.east,
        "west=" + this.west,
        "north=" + this.north,
        "south=" + this.south,
      ].join(" ") +
      ")"
    );
  }
}
