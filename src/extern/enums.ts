// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

const enum LayoutDirection {
  Floating,
  Horizontal,
  Vertical,
}

const enum ClientAreaOption {
  PlacementArea,
  MovementArea,
  MaximizeArea,
  MaximizeFullArea,
  FullScreenArea,
  WorkArea,
  FullArea,
  ScreenArea,
}

const enum Edge {
  TopEdge = 1,
  LeftEdge = 2,
  RightEdge = 4,
  BottomEdge = 8,
}

const enum MaximizeMode {
  MaximizeRestore = 0,
  MaximizeVertical = 1,
  MaximizeHorizontal = 2,
  MaximizeFull = MaximizeVertical | MaximizeHorizontal,
}

const enum RectParts {
  Top,
  Bottom,
  Left,
  Right,
  Whole,
}

const enum WindowLayer {
  Below,
  Normal,
  Above,
}

function getWindowLayer(index: number): WindowLayer {
  if (index === 0) return WindowLayer.Below;
  else if (index === 1) return WindowLayer.Normal;
  else if (index === 2) return WindowLayer.Above;
  else return WindowLayer.Normal;
}
