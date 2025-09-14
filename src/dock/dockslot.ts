// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class DockSlot {
  readonly _position: DockPosition;
  readonly _order: number;
  public window: WindowClass | null;

  public get position(): DockPosition {
    return this._position;
  }
  public get order(): number {
    return this._order;
  }

  constructor(position: DockPosition, order: number) {
    this._position = position;
    this._order = order;
    this.window = null;
  }
}
