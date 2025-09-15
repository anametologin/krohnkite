/*
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

const enum CardinalDirection {
  North,
  East,
  South,
  West,
}

class windRose {
  private direction: CardinalDirection;

  constructor(direction?: string) {
    switch (direction) {
      case "0":
        this.direction = CardinalDirection.North;
        break;
      case "1":
        this.direction = CardinalDirection.East;
        break;
      case "2":
        this.direction = CardinalDirection.South;
        break;
      case "3":
        this.direction = CardinalDirection.West;
        break;
      default:
        this.direction = CardinalDirection.North;
    }
  }
  public get north(): boolean {
    return this.direction === CardinalDirection.North;
  }
  public get east(): boolean {
    return this.direction === CardinalDirection.East;
  }
  public get south(): boolean {
    return this.direction === CardinalDirection.South;
  }
  public get west(): boolean {
    return this.direction === CardinalDirection.West;
  }

  public cwRotation() {
    this.direction = (this.direction + 1) % 4;
  }
  public ccwRotation() {
    this.direction = this.direction - 1 >= 0 ? this.direction - 1 : 3;
  }
  public toString(): string {
    switch (this.direction) {
      case 0: {
        return "North";
      }
      case 1: {
        return "East";
      }
      case 2: {
        return "South";
      }
      case 3: {
        return "West";
      }
      default: {
        return "Unknown";
      }
    }
  }
}
