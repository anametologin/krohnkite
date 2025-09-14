// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class MonocleLayout implements ILayout {
  public static readonly id = "MonocleLayout";
  public readonly description: string = "Monocle";

  public readonly classID = MonocleLayout.id;

  public apply(
    ctx: EngineContext,
    tileables: WindowClass[],
    area: Rect,
    gap: number
  ): void {
    /* Tile all tileables */
    tileables.forEach((tile) => {
      tile.state = CONFIG.monocleMaximize
        ? WindowState.Maximized
        : WindowState.Tiled;
      tile.geometry = area;
    });

    /* KWin-specific `monocleMinimizeRest` option */
    if (
      ctx.backend === KWinDriver.backendName &&
      KWINCONFIG.monocleMinimizeRest
    ) {
      const tiles = [...tileables];
      ctx.setTimeout(() => {
        const current = ctx.currentWindow;
        if (current && current.tiled) {
          tiles.forEach((window) => {
            if (window !== current)
              (window.window as KWinWindow).window.minimized = true;
          });
        }
      }, 50);
    }
  }

  public clone(): this {
    /* fake clone */
    return this;
  }

  public handleShortcut(
    ctx: EngineContext,
    input: Shortcut,
    data?: any
  ): boolean {
    switch (input) {
      // case Shortcut.Up:
      // case Shortcut.Left:
      case Shortcut.DWMLeft:
      case Shortcut.FocusNext:
      case Shortcut.FocusUp:
      case Shortcut.FocusLeft:
        ctx.cycleFocus(-1);
        return true;
      // case Shortcut.Down:
      // case Shortcut.Right:
      case Shortcut.DWMRight:
      case Shortcut.FocusPrev:
      case Shortcut.FocusDown:
      case Shortcut.FocusRight:
        ctx.cycleFocus(1);
        return true;
      default:
        return false;
    }
  }

  public toString(): string {
    return "MonocleLayout()";
  }
}
