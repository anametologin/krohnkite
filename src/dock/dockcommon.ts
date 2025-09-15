/*
    SPDX-FileCopyrightText: 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

const DockPosition = {
  left: 1,
  right: 2,
  top: 3,
  bottom: 4,
} as const;
type DockPosition = (typeof DockPosition)[keyof typeof DockPosition];

const HDockAlignment = {
  center: 1,
  left: 2,
  right: 3,
} as const;
type HDockAlignment = (typeof HDockAlignment)[keyof typeof HDockAlignment];

const VDockAlignment = {
  center: 1,
  top: 2,
  bottom: 3,
} as const;
type VDockAlignment = (typeof VDockAlignment)[keyof typeof VDockAlignment];

const EdgeAlignment = {
  outside: 1,
  middle: 2,
  inside: 3,
} as const;
type EdgeAlignment = (typeof EdgeAlignment)[keyof typeof EdgeAlignment];

interface IDockCfg {
  hHeight: number;
  hWide: number;
  hEdgeGap: number;
  hGap: number;
  hAlignment: HDockAlignment;
  hEdgeAlignment: EdgeAlignment;
  vHeight: number;
  vWide: number;
  vEdgeGap: number;
  vGap: number;
  vEdgeAlignment: VDockAlignment;
  vAlignment: VDockAlignment;
}

interface IDock {
  renderedOutputId: string;
  renderedTime: number | null;
  priority: number;
  position: DockPosition | null;
  autoDock: boolean;
  cfg: IDockCfg;
  clone(): IDock;
}

interface IDockEntry {
  id: string;
  slots: DockSlot[];
  remove(window: WindowClass): void;
  arrange(dockedWindows: WindowClass[], workingArea: Rect): Rect;
  handleShortcut(window: WindowClass, shortcut: Shortcut): boolean;
}

interface IDockStore {
  render(srf: ISurface, win: WindowClass[], workingArea: Rect): Rect;
}
