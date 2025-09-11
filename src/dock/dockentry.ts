// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

class DockEntry implements IDockEntry {
  private _slots: DockSlot[];
  private surfaceCfg: SurfaceCfg<IDockCfg>;
  private _id: string;

  constructor(cfg: SurfaceCfg<IDockCfg>, id: string) {
    this.surfaceCfg = cfg;
    this._slots = this.parseSlots();
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }

  public get slots(): DockSlot[] {
    return this._slots;
  }

  public remove(window: WindowClass) {
    for (let slot of this.slots) {
      //if (slot.window !== null && slot.window.id === window.id) {
      if (slot.window === window) {
        slot.window = null;
        break;
      }
    }
  }

  public arrange(dockedWindows: WindowClass[], workingArea: Rect): Rect {
    const IS_WIDE = workingArea.width > workingArea.height;
    let dockCfg: IDockCfg;

    let renderedTime = new Date().getTime();
    let renderedOutputId = this.id;

    this.arrangeSlots(dockedWindows);
    this.assignSizes(workingArea);

    const leftSlot = this.getSlot(DockPosition.left);
    const rightSlot = this.getSlot(DockPosition.right);
    const topSlot = this.getSlot(DockPosition.top);
    const bottomSlot = this.getSlot(DockPosition.bottom);

    let leftBorder = workingArea.x;
    let width = workingArea.width;
    let topBorder = workingArea.y;
    let height = workingArea.height;

    function leftSlotArrange() {
      if (leftSlot !== null) {
        dockCfg = leftSlot.window!.dock!.cfg;
        let leftSlotHeight = Math.min(
          (workingArea.height * dockCfg.vHeight) / 100,
          height
        );

        let initRect = new Rect(
          leftBorder,
          topBorder,
          (workingArea.width * dockCfg.vWide) / 100,
          leftSlotHeight
        );
        leftBorder = leftBorder + initRect.width;
        width = width - initRect.width;

        leftSlot.window!.geometry = DockEntry.align(
          initRect,
          leftSlot.position,
          dockCfg,
          height
        );
        leftSlot.window!.dock!.renderedTime = renderedTime;
        leftSlot.window!.dock!.renderedOutputId = renderedOutputId;
      }
    }
    function rightSlotArrange() {
      if (rightSlot !== null) {
        dockCfg = rightSlot.window!.dock!.cfg;
        let rightSlotHeight = Math.min(
          (workingArea.height * dockCfg.vHeight) / 100,
          height
        );
        let initRect = new Rect(
          workingArea.x +
            workingArea.width -
            (workingArea.width * dockCfg.vWide) / 100,
          topBorder,
          (workingArea.width * dockCfg.vWide) / 100,
          rightSlotHeight
        );
        width = width - initRect.width;

        rightSlot.window!.geometry = DockEntry.align(
          initRect,
          rightSlot.position,
          dockCfg,
          height
        );
        rightSlot.window!.dock!.renderedTime = renderedTime;
        rightSlot.window!.dock!.renderedOutputId = renderedOutputId;
      }
    }
    function topSlotArrange() {
      if (topSlot !== null) {
        dockCfg = topSlot.window!.dock!.cfg;
        let topSlotWidth = Math.min(
          (workingArea.width * dockCfg.hWide) / 100,
          width
        );
        let initRect = new Rect(
          leftBorder,
          topBorder,
          topSlotWidth,
          (workingArea.height * dockCfg.hHeight) / 100
        );
        topBorder = topBorder + initRect.height;
        height = height - initRect.height;

        topSlot.window!.geometry = DockEntry.align(
          initRect,
          topSlot.position,
          dockCfg,
          width
        );
        topSlot.window!.dock!.renderedTime = renderedTime;
        topSlot.window!.dock!.renderedOutputId = renderedOutputId;
      }
    }
    function bottomSlotArrange() {
      if (bottomSlot !== null) {
        dockCfg = bottomSlot.window!.dock!.cfg;
        let bottomSlotWidth = Math.min(
          (workingArea.width * dockCfg.hWide) / 100,
          width
        );
        let initRect = new Rect(
          leftBorder,
          workingArea.y +
            workingArea.height -
            (workingArea.height * dockCfg.hHeight) / 100,
          bottomSlotWidth,
          (workingArea.height * dockCfg.hHeight) / 100
        );
        height = height - initRect.height;

        bottomSlot.window!.geometry = DockEntry.align(
          initRect,
          bottomSlot.position,
          dockCfg,
          width
        );
        bottomSlot.window!.dock!.renderedTime = renderedTime;
        bottomSlot.window!.dock!.renderedOutputId = renderedOutputId;
      }
    }

    if (IS_WIDE) {
      leftSlotArrange();
      rightSlotArrange();
      topSlotArrange();
      bottomSlotArrange();
    } else {
      topSlotArrange();
      bottomSlotArrange();
      leftSlotArrange();
      rightSlotArrange();
    }
    return new Rect(leftBorder, topBorder, width, height);
  }

  public handleShortcut(window: WindowClass, shortcut: Shortcut): boolean {
    const slot = this.getSlotByWindow(window);
    let desiredPosition: DockPosition;
    if (!slot || !window.dock) {
      return false;
    }
    switch (shortcut) {
      case Shortcut.SwapLeft:
        desiredPosition = DockPosition.left;
        break;
      case Shortcut.SwapUp:
        desiredPosition = DockPosition.top;
        break;
      case Shortcut.SwapRight:
        desiredPosition = DockPosition.right;
        break;
      case Shortcut.SwapDown:
        desiredPosition = DockPosition.bottom;
        break;
      default:
        return false;
    }

    if (slot.position !== desiredPosition) {
      const desiredSlot = this.getSlotByPosition(desiredPosition);
      if (desiredSlot !== null && desiredSlot.window === null) {
        window.dock.position = desiredPosition;
        return true;
      }
    }
    return false;
  }

  private static align(
    initRect: Rect,
    position: DockPosition,
    cfg: IDockCfg,
    wholeSize: number
  ): Rect {
    let leftBorder = initRect.x;
    let topBorder = initRect.y;
    let width = initRect.width;
    let height = initRect.height;

    switch (position) {
      case DockPosition.left:
      case DockPosition.right:
        [width, leftBorder] = DockEntry.alignEdge(
          width,
          leftBorder,
          cfg.vEdgeGap,
          position,
          cfg.vEdgeAlignment
        );

        if (2 * cfg.vGap < height) {
          if (wholeSize - height < 2 * cfg.vGap) {
            topBorder = topBorder + cfg.vGap;
            height = height - 2 * cfg.vGap;
          } else if (cfg.vAlignment === VDockAlignment.top) {
            topBorder = topBorder + cfg.vGap;
          } else if (cfg.vAlignment === VDockAlignment.center) {
            topBorder = topBorder + (wholeSize - height) / 2;
          } else if (cfg.vAlignment === VDockAlignment.bottom) {
            topBorder = topBorder + (wholeSize - height - cfg.vGap);
          }
        }
        return new Rect(leftBorder, topBorder, width, height);

      case DockPosition.top:
      case DockPosition.bottom:
        [height, topBorder] = DockEntry.alignEdge(
          height,
          topBorder,
          cfg.hEdgeGap,
          position,
          cfg.hEdgeAlignment
        );

        if (2 * cfg.hGap < width) {
          if (wholeSize - width < 2 * cfg.hGap) {
            leftBorder = leftBorder + cfg.hGap;
            width = width - 2 * cfg.hGap;
          } else if (cfg.hAlignment === HDockAlignment.left) {
            leftBorder = leftBorder + cfg.hGap;
          } else if (cfg.hAlignment === HDockAlignment.center) {
            leftBorder = leftBorder + (wholeSize - width) / 2;
          } else if (cfg.hAlignment === HDockAlignment.right) {
            leftBorder = leftBorder + (wholeSize - width - cfg.hGap);
          }
        }

        return new Rect(leftBorder, topBorder, width, height);
    }
  }

  private static alignEdge(
    dimension: number,
    sideBorder: number,
    gap: number,
    position: DockPosition,
    alignment: EdgeAlignment
  ): [number, number] {
    if (2 * gap > dimension) return [dimension, sideBorder];
    switch (alignment) {
      case EdgeAlignment.outside:
        if (position === DockPosition.right || position === DockPosition.bottom)
          sideBorder = sideBorder + gap;
        return [dimension - gap, sideBorder];
      case EdgeAlignment.middle:
        return [dimension - 2 * gap, sideBorder + gap];
      case EdgeAlignment.inside:
        if (position === DockPosition.left || position === DockPosition.top)
          sideBorder = sideBorder + gap;
        return [dimension - gap, sideBorder];
    }
  }

  private getSlot(position: DockPosition): DockSlot | null {
    let slot = this.slots.find((slot) => slot.position === position) || null;
    if (slot === null || slot.window === null) {
      return null;
    } else if (
      slot.window.state !== WindowState.Docked ||
      slot.window.dock!.position !== position
    ) {
      slot.window = null;
      return null;
    } else {
      return slot;
    }
  }

  private getSlotByPosition(position: DockPosition): DockSlot | null {
    return this.slots.find((slot) => slot.position === position) || null;
  }

  private getSlotByWindow(window: WindowClass) {
    let slot = this.slots.find((slot) => slot.window === window) || null;
    if (slot === null || slot.window === null) {
      return null;
    } else if (slot.window.state !== WindowState.Docked) {
      slot.window = null;
      return null;
    } else {
      return slot;
    }
  }

  private arrangeSlots(dockedWindows: WindowClass[]) {
    let contenders = this.arrangeContenders(dockedWindows, true);
    if (contenders.length !== 0 && this.isHasEmptySlot()) {
      contenders.forEach((w) => (w.dock!.position = null));
      contenders = this.arrangeContenders(contenders, false);
    }
    contenders.forEach((w) => {
      w.state = WindowState.Tiled;
    });
  }

  private arrangeContenders(
    windows: WindowClass[],
    init: boolean
  ): WindowClass[] {
    let contenders: WindowClass[] = [];
    for (const slot of this.slots) {
      if (!init && slot.window !== null) continue;
      if (windows.length === 0 && contenders.length === 0) {
        slot.window = null;
        continue;
      }
      let tempDockedWindows: WindowClass[] = [];
      contenders.push(
        ...windows.filter((w) => {
          if (w.dock === null) {
            w.dock = new Dock(this.surfaceCfg.cfg);
            return true;
          }
          if (w.dock.position === slot.position) {
            return true;
          }
          if (w.dock.position === null) return true;

          tempDockedWindows.push(w);
        })
      );
      windows = tempDockedWindows;

      if (contenders.length !== 0) {
        this.contendersSort(contenders, slot.position, this.id);
        slot.window = contenders.pop()!;
        slot.window.dock!.position = slot.position;
      } else {
        slot.window = null;
      }
    }
    return contenders;
  }

  private assignSizes(workingArea: Rect) {
    const MAX_SIZE = 50;
    const MAX_GAPS = {
      width: workingArea.width * 0.05,
      height: workingArea.height * 0.05,
    };

    let oppositeSlot: DockSlot | null = null;
    let donePositions: DockPosition[] = [];
    let dockCfg: IDockCfg;
    let oppositeDockCfg: IDockCfg;

    for (const slot of this.slots) {
      if (slot.window === null) continue;
      dockCfg = slot.window!.dock!.cfg;
      const minSize: ISize = {
        width: Math.max(
          (slot.window.minSize.width * 100) / workingArea.width,
          5
        ),
        height: Math.max(
          (slot.window.minSize.height * 100) / workingArea.height,
          5
        ),
      };

      if (donePositions.indexOf(slot.position) >= 0) continue;
      switch (slot.position) {
        case DockPosition.top:
          oppositeSlot = this.getSlot(DockPosition.bottom);
          break;
        case DockPosition.bottom:
          oppositeSlot = this.getSlot(DockPosition.top);
          break;
        case DockPosition.left:
          oppositeSlot = this.getSlot(DockPosition.right);
          break;
        case DockPosition.right:
          oppositeSlot = this.getSlot(DockPosition.left);
          break;
        default:
          warning("DockEntry assignSizes - invalid position");
          break;
      }

      switch (slot.position) {
        case DockPosition.left:
        case DockPosition.right:
          if (dockCfg.vGap > MAX_GAPS.width) dockCfg.vGap = MAX_GAPS.width;
          if (
            dockCfg.vWide <
            minSize.width + (200 * dockCfg.vGap) / workingArea.width
          )
            dockCfg.vWide =
              minSize.width + (200 * dockCfg.vGap) / workingArea.width;
          if (oppositeSlot !== null) {
            oppositeDockCfg = oppositeSlot.window!.dock!.cfg;
            let opMinSize: ISize = {
              width: Math.max(
                (oppositeSlot.window!.minSize.width * 100) / workingArea.width,
                5
              ),
              height: Math.max(
                (oppositeSlot.window!.minSize.height * 100) /
                  workingArea.height,
                5
              ),
            };
            if (oppositeDockCfg.vGap > MAX_GAPS.width)
              oppositeDockCfg.vGap = MAX_GAPS.width;
            if (
              oppositeDockCfg.vWide <
              opMinSize.width + (200 * oppositeDockCfg.vGap) / workingArea.width
            )
              oppositeDockCfg.vWide =
                opMinSize.width +
                (200 * oppositeDockCfg.vGap) / workingArea.width;
            if (dockCfg.vWide + oppositeDockCfg.vWide > MAX_SIZE) {
              if (
                dockCfg.vWide > MAX_SIZE / 2 &&
                oppositeDockCfg.vWide > MAX_SIZE / 2
              ) {
                dockCfg.vWide = MAX_SIZE / 2;
                oppositeDockCfg.vWide = MAX_SIZE / 2;
              } else if (dockCfg.vWide > MAX_SIZE / 2) {
                dockCfg.vWide = MAX_SIZE - oppositeDockCfg.vWide;
              } else {
                oppositeDockCfg.vWide = MAX_SIZE - dockCfg.vWide;
              }
            }
            if (oppositeDockCfg.vHeight > 100) oppositeDockCfg.vHeight = 100;
            if (oppositeDockCfg.vHeight < minSize.height)
              oppositeDockCfg.vHeight = minSize.height;
            donePositions.push(oppositeSlot.position);
          } else {
            if (dockCfg.vWide > MAX_SIZE) {
              dockCfg.vWide = MAX_SIZE;
            }
          }
          if (dockCfg.vHeight > 100) dockCfg.vHeight = 100;
          if (dockCfg.vHeight < minSize.height)
            dockCfg.vHeight = minSize.height;
          break;
        case DockPosition.top:
        case DockPosition.bottom:
          if (dockCfg.hGap > MAX_GAPS.height) dockCfg.hGap = MAX_GAPS.height;
          if (
            dockCfg.hHeight <
            minSize.height + (200 * dockCfg.hGap) / workingArea.height
          )
            dockCfg.hHeight =
              minSize.height + (200 * dockCfg.hGap) / workingArea.height;
          if (oppositeSlot !== null) {
            oppositeDockCfg = oppositeSlot.window!.dock!.cfg;

            let opMinSize: ISize = {
              width: Math.max(
                (oppositeSlot.window!.minSize.width * 100) / workingArea.width,
                5
              ),
              height: Math.max(
                (oppositeSlot.window!.minSize.height * 100) /
                  workingArea.height,
                5
              ),
            };

            if (oppositeDockCfg.hGap > MAX_GAPS.height)
              oppositeDockCfg.hGap = MAX_GAPS.height;
            if (
              oppositeDockCfg.hHeight <
              opMinSize.height +
                (200 * oppositeDockCfg.hGap) / workingArea.height
            )
              oppositeDockCfg.hHeight =
                opMinSize.height +
                (200 * oppositeDockCfg.hGap) / workingArea.height;

            if (dockCfg.hHeight + oppositeDockCfg.hHeight > MAX_SIZE) {
              if (
                dockCfg.hHeight > MAX_SIZE / 2 &&
                oppositeDockCfg.hHeight > MAX_SIZE / 2
              ) {
                dockCfg.hHeight = MAX_SIZE / 2;
                oppositeDockCfg.hHeight = MAX_SIZE / 2;
              } else if (dockCfg.hHeight > MAX_SIZE / 2) {
                dockCfg.hHeight = MAX_SIZE - oppositeDockCfg.hHeight;
              } else {
                oppositeDockCfg.hHeight = MAX_SIZE - dockCfg.hHeight;
              }
            }
            if (oppositeDockCfg.hWide > 100) oppositeDockCfg.hWide = 100;
            if (oppositeDockCfg.hWide < opMinSize.width)
              oppositeDockCfg.hWide = opMinSize.width;
            donePositions.push(oppositeSlot.position);
          } else {
            if (dockCfg.hHeight > MAX_SIZE) {
              dockCfg.hHeight = MAX_SIZE;
            }
          }
          if (dockCfg.hWide > 100) dockCfg.hWide = 100;
          if (dockCfg.hWide < minSize.width) dockCfg.hWide = minSize.width;
          break;
      }
    }
  }

  private contendersSort(
    contenders: WindowClass[],
    position: DockPosition,
    id: string
  ) {
    function compare(a: WindowClass, b: WindowClass) {
      if (a.dock === null && b.dock === null) return 0;
      else if (a.dock === null) return -1;
      else if (b.dock === null) return 1;
      else if (a.dock.position === position && b.dock.position !== position)
        return 1;
      else if (b.dock.position === position && a.dock.position !== position)
        return -1;
      else if (a.dock.priority > b.dock.priority) return 1;
      else if (b.dock.priority > a.dock.priority) return -1;
      else if (a.dock.renderedTime === null && b.dock.renderedTime === null)
        return 0;
      else if (a.dock.renderedTime === null) return -1;
      else if (b.dock.renderedTime === null) return 1;
      else if (a.dock.renderedOutputId === id && b.dock.renderedOutputId !== id)
        return 1;
      else if (b.dock.renderedOutputId === id && a.dock.renderedOutputId !== id)
        return -1;
      else if (a.dock.renderedTime > b.dock.renderedTime) return 1;
      else if (b.dock.renderedTime > a.dock.renderedTime) return -1;
      else return 0;
    }
    contenders.sort(compare);
  }

  private parseSlots(): DockSlot[] {
    const slots = [];
    // Left
    if (CONFIG.dockOrder[0] !== 0)
      slots.push(new DockSlot(DockPosition.left, CONFIG.dockOrder[0]));
    // Top
    if (CONFIG.dockOrder[1] !== 0)
      slots.push(new DockSlot(DockPosition.top, CONFIG.dockOrder[1]));
    // Right
    if (CONFIG.dockOrder[2] !== 0)
      slots.push(new DockSlot(DockPosition.right, CONFIG.dockOrder[2]));
    // Bottom
    if (CONFIG.dockOrder[3] !== 0)
      slots.push(new DockSlot(DockPosition.bottom, CONFIG.dockOrder[3]));

    slots.sort((a, b) => a.order - b.order);
    return slots;
  }

  private isHasEmptySlot(): boolean {
    return !this.slots.every((slot) => slot.window !== null);
  }
}
