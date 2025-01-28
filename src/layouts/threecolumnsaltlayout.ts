// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
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

class ThreeColumnAltLayout implements ILayout {
    public static readonly MIN_MASTER_RATIO = 0.2;
    public static readonly MAX_MASTER_RATIO = 0.75;
    public static readonly id = "ThreeColumnAltLayout";
  
    public readonly classID = ThreeColumnAltLayout.id;
  
    public get description(): string {
      return "Three-Column-Alt [" + this.masterSize + "]";
    }
  
    private masterRatio: number;
    private masterSize: number;
  
    constructor() {
      this.masterRatio = 0.6;
      this.masterSize = 1;
    }
  
    public adjust(
      area: Rect,
      tiles: WindowClass[],
      basis: WindowClass,
      delta: RectDelta
  ): void {
      // Ignore any manual adjustments so as not to break our sequence
      return;
  }
  
  
      public apply(ctx: EngineContext, tileables: WindowClass[], area: Rect): void {
        // 1) Force all windows to "Tiled" mode
        tileables.forEach((tile) => (tile.state = WindowState.Tiled));
    
        const count = tileables.length;
        if (count === 0) return; // No windows
    
        // === CASE 1: 1 WINDOW ===
        // Place it in the "center" (fills the entire screen in practice)
        if (count === 1) {
            tileables[0].geometry = area;
            return;
        }
    
        // === CASE 2: 2 WINDOWS ===
        // #1 on the left, #2 on the right (no center column in use)
        if (count === 2) {
            const [leftArea, rightArea] = LayoutUtils.splitAreaHalfWeighted(
                area,
                0.5,
                CONFIG.tileLayoutGap,
                true // true => vertical split (columns)
            );
    
            tileables[0].geometry = leftArea;  // Window #1 on the left
            tileables[1].geometry = rightArea; // Window #2 on the right
            return;
        }
    
        // === CASE 3: 3 WINDOWS ===
        // #1 -> LEFT, #2 -> RIGHT, #3 (the latest) -> MIDDLE
        // => split the screen into 3 equally sized columns
        if (count === 3) {
            const colRatios = [1/3, 1/3, 1/3];
            const columns = LayoutUtils.splitAreaWeighted(
                area,
                colRatios,
                CONFIG.tileLayoutGap,
                true
            );
          // columns[0] => left, columns[1] => middle, columns[2] => right
          // But we want: #1 -> left, #2 -> right, #3 -> middle.
          tileables[0].geometry = columns[0]; // #1 left
          tileables[2].geometry = columns[1]; // #3 middle
          tileables[1].geometry = columns[2]; // #2 right
            return;
        }
    
        // === CASE 4+ WINDOWS ===
        // #1 -> LEFT, #2 -> RIGHT,
        // #3, #4, #5, ... -> MIDDLE COLUMN (stacked)
        {
          // Split into three equal columns
          const colRatios = [1/3, 1/3, 1/3];
          const [leftArea, middleArea, rightArea] = LayoutUtils.splitAreaWeighted(
              area,
              colRatios,
              CONFIG.tileLayoutGap,
              true
          );

          // #1 on the left, #2 on the right
          tileables[0].geometry = leftArea;
          tileables[1].geometry = rightArea;

          // Everyone else (#3, #4, #5, etc.) goes into the middle, stacked vertically
          const middleStack = tileables.slice(2); // from the 3rd onward
          LayoutUtils.splitAreaWeighted(
              middleArea,
              middleStack.map(t => t.weight),
              CONFIG.tileLayoutGap
          ).forEach((subRect, i) => {
              middleStack[i].geometry = subRect;
          });
      }
    }      
  
    public clone(): ILayout {
      const other = new ThreeColumnAltLayout();
      other.masterRatio = this.masterRatio;
      other.masterSize = this.masterSize;
      return other;
    }
  
    public handleShortcut(
      ctx: EngineContext,
      input: Shortcut,
      data?: any
    ): boolean {
      switch (input) {
        case Shortcut.Increase:
          this.resizeMaster(ctx, +1);
          return true;
        case Shortcut.Decrease:
          this.resizeMaster(ctx, -1);
          return true;
        case Shortcut.DWMLeft:
          this.masterRatio = clip(
            slide(this.masterRatio, -0.05),
            ThreeColumnAltLayout.MIN_MASTER_RATIO,
            ThreeColumnAltLayout.MAX_MASTER_RATIO
          );
          return true;
        case Shortcut.DWMRight:
          this.masterRatio = clip(
            slide(this.masterRatio, +0.05),
            ThreeColumnAltLayout.MIN_MASTER_RATIO,
            ThreeColumnAltLayout.MAX_MASTER_RATIO
          );
          return true;
        default:
          return false;
      }
    }
  
    public toString(): string {
      return "ThreeColumnAltLayout(nmaster=" + this.masterSize + ")";
    }
  
    private resizeMaster(ctx: EngineContext, step: -1 | 1): void {
      this.masterSize = clip(this.masterSize + step, 1, 10);
      ctx.showNotification(this.description);
    }
  }
  