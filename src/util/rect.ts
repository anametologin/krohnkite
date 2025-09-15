/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class Rect {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  public get maxX(): number {
    return this.x + this.width;
  }
  public get maxY(): number {
    return this.y + this.height;
  }

  public get center(): [number, number] {
    return [
      this.x + Math.floor(this.width / 2),
      this.y + Math.floor(this.height / 2),
    ];
  }
  public get activationPoint(): [number, number] {
    return [this.x + Math.floor(this.width / 2), this.y + 10];
  }

  public clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  public equals(other: Rect): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.width === other.width &&
      this.height === other.height
    );
  }

  public gap(left: number, right: number, top: number, bottom: number): Rect {
    return new Rect(
      this.x + left,
      this.y + top,
      this.width - (left + right),
      this.height - (top + bottom)
    );
  }

  public gap_mut(
    left: number,
    right: number,
    top: number,
    bottom: number
  ): this {
    this.x += left;
    this.y += top;
    this.width -= left + right;
    this.height -= top + bottom;
    return this;
  }

  public includes(other: Rect): boolean {
    return (
      this.x <= other.x &&
      this.y <= other.y &&
      other.maxX < this.maxX &&
      other.maxY < this.maxY
    );
  }

  public includesPoint(
    [x, y]: [number, number],
    part: RectParts = RectParts.Whole
  ): boolean {
    if (part === RectParts.Top)
      return (
        this.x <= x &&
        x <= this.maxX &&
        this.y <= y &&
        y <= this.y + this.height / 2
      );
    else if (part === RectParts.Bottom)
      return (
        this.x <= x &&
        x <= this.maxX &&
        y > this.y + this.height / 2 &&
        y <= this.maxY
      );
    else if (part === RectParts.Left) {
      return (
        this.y <= y &&
        y <= this.maxY &&
        this.x <= x &&
        x <= this.x + this.height / 2
      );
    } else if (part === RectParts.Right) {
      return (
        this.y <= y &&
        y <= this.maxY &&
        x > this.x + this.width / 2 &&
        x <= this.maxX
      );
    } else {
      return this.x <= x && x <= this.maxX && this.y <= y && y <= this.maxY;
    }
  }

  public isTopZone(
    [x, y]: [number, number],
    activeZone: percentType = 10
  ): boolean {
    return (
      this.y <= y &&
      y <= this.y + (this.height * activeZone) / 100 &&
      this.x <= x &&
      x <= this.maxX
    );
  }

  public isBottomZone(
    [x, y]: [number, number],
    activeZone: percentType = 10
  ): boolean {
    return (
      y >= this.maxY - (this.height * activeZone) / 100 &&
      y <= this.maxY &&
      this.x <= x &&
      x <= this.maxX
    );
  }

  public isLeftZone(
    [x, y]: [number, number],
    activeZone: percentType = 10
  ): boolean {
    return (
      this.x <= x &&
      x <= this.x + (this.width * activeZone) / 100 &&
      this.y <= y &&
      y <= this.maxY
    );
  }

  public isRightZone(
    [x, y]: [number, number],
    activeZone: percentType = 10
  ): boolean {
    return (
      x >= this.maxX - (this.width * activeZone) / 100 &&
      x <= this.maxX &&
      this.y <= y &&
      y <= this.maxY
    );
  }

  public subtract(other: Rect): Rect {
    return new Rect(
      this.x - other.x,
      this.y - other.y,
      this.width - other.width,
      this.height - other.height
    );
  }

  public intersection(other: Rect, coordinate: "x" | "y") {
    if (coordinate === "x") {
      return Math.max(
        0,
        Math.min(this.maxX, other.maxX) - Math.max(this.x, other.x)
      );
    } else {
      return Math.max(
        0,
        Math.min(this.maxY, other.maxY) - Math.max(this.y, other.y)
      );
    }
  }

  public toString(): string {
    return "Rect(" + [this.x, this.y, this.width, this.height].join(", ") + ")";
  }
}
