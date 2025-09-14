// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

interface TileManager {
  readonly rootTile: Tile;

  tileRemoved: QSignal;

  bestTileForPosition(x: number, y: number): Tile;
}

interface Tile {
  readonly absoluteGeometry: QRect;
  readonly absoluteGeometryInScreen: QRect;
  readonly positionInLayout: number;
  readonly parent: Tile;
  readonly tiles: Tile[];
  readonly windows: Window[];
  readonly isLayout: boolean;
  readonly canBeRemoved: boolean;
}
