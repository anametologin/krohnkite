/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

enum CascadeDirection {
  NorthWest = 0,
  North = 1,
  NorthEast = 2,
  East = 3,
  SouthEast = 4,
  South = 5,
  SouthWest = 6,
  West = 7,
}

class CascadeLayout implements ILayout {
  public static readonly id = "CascadeLayout";

  public readonly capacity?: number | null;

  /** Decompose direction into vertical and horizontal steps */
  public static decomposeDirection(
    dir: CascadeDirection
  ): [-1 | 0 | 1, -1 | 0 | 1] {
    switch (dir) {
      case CascadeDirection.NorthWest:
        return [-1, -1];
      case CascadeDirection.North:
        return [-1, 0];
      case CascadeDirection.NorthEast:
        return [-1, 1];
      case CascadeDirection.East:
        return [0, 1];
      case CascadeDirection.SouthEast:
        return [1, 1];
      case CascadeDirection.South:
        return [1, 0];
      case CascadeDirection.SouthWest:
        return [1, -1];
      case CascadeDirection.West:
        return [0, -1];
    }
  }

  public readonly classID = CascadeLayout.id;

  public get description() {
    return "Cascade [" + CascadeDirection[this.dir] + "]";
  }

  constructor(
    private dir: CascadeDirection = CascadeDirection.SouthEast,
    capacity?: number | null
  ) {
    this.capacity = capacity !== undefined ? capacity : null;
  }

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    const [vertStep, horzStep] = CascadeLayout.decomposeDirection(this.dir);

    // TODO: adjustable step size
    const stepSize = 25;

    const windowWidth =
      horzStep !== 0
        ? area.width - stepSize * (tileables.length - 1)
        : area.width;
    const windowHeight =
      vertStep !== 0
        ? area.height - stepSize * (tileables.length - 1)
        : area.height;

    const baseX = horzStep >= 0 ? area.x : area.maxX - windowWidth;
    const baseY = vertStep >= 0 ? area.y : area.maxY - windowHeight;

    let x = baseX,
      y = baseY;
    tileables.forEach((tile) => {
      tile.state = WindowState.Tiled;
      tile.geometry = new Rect(x, y, windowWidth, windowHeight);

      x += horzStep * stepSize;
      y += vertStep * stepSize;
    });
  }

  public clone(): CascadeLayout {
    return new CascadeLayout(this.dir);
  }

  public handleShortcut(
    ctx: EngineContext,
    input: Shortcut,
    data?: any
  ): boolean {
    switch (input) {
      case Shortcut.Increase:
        this.dir = (this.dir + 1 + 8) % 8;
        ctx.showNotification(this.description);
        break;
      case Shortcut.Decrease:
        this.dir = (this.dir - 1 + 8) % 8;
        ctx.showNotification(this.description);
        break;
      default:
        return false;
    }
    return true;
  }
}
