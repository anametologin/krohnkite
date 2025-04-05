# ThreeColumnLayout Alt

This layout script provides an alternative to the ThreeColumnLayout. It arranges windows into up to three columns, depending on how many windows are present, and uses specific rules for placing them. I'm using an ultra wide screen (34:9) and i find this arrangement to be working the best for me.

## Summary

- **1 Window**  
  Occupies the entire screen (conceptually "center").
  
- **2 Windows**  
  Windows are placed in left and right columns.
  
- **3 Windows**  
  Each column—left, center, right—has exactly one window (the exact order is configurable).
  
- **4+ Windows**  
  Typically, the first two windows occupy two of the columns (e.g., left/right), and all subsequent windows stack in the remaining column.

## How It Works

### 1 Window

    +-------------------------------------+
    |                                     |
    |           SINGLE WINDOW            |
    |                                     |
    +-------------------------------------+

- If there is only one window open, it fills the entire workspace.
- You can think of this as the "center," but practically it just takes the whole screen.

### 2 Windows

    +-----------------+-------------------+
    |                 |                   |
    |   WINDOW #1     |    WINDOW #2      |
    |     (LEFT)      |      (RIGHT)      |
    |                 |                   |
    +-----------------+-------------------+

- With two windows, the layout can split the screen into two equal columns (50%/50%) or any ratio you prefer.
- By default, the first window goes to the **left**, and the second to the **right** (no center column used).

### 3 Windows

    +------------+------------+------------+
    |  WINDOW #1 |  WINDOW #3 |  WINDOW #2 |
    |    LEFT    |   MIDDLE   |   RIGHT    |
    |            |            |            |
    +------------+------------+------------+

_The specific order—left, center, right—depends on how you configure it. Some may want #2 in the center, #3 on the right, etc._

- The workspace is split into three columns (often 1/3 each).
- Each column contains exactly **one** window—no stacking in this scenario.

### 4+ Windows

Example with 4 windows:

    +------------+------------+------------+
    |  WINDOW #1 |            |  WINDOW #2 |
    |    LEFT    |   MIDDLE   |   RIGHT    |
    +------------+            |            |
    |            |  #3, #4... |            |
    |            | (stacked)  |            |
    +------------+------------+------------+

- The first and second windows can occupy the left and right columns.
- Any additional windows (#3, #4, etc.) stack vertically (or horizontally, if you prefer) in the remaining column.
- This ensures only one column grows with more windows.

## Configuration and Tips

1. **Krohnkite Settings**  
   - In *KWin Scripts → Krohnkite → Configure…*, set **“Position of new window”** to **Last** if you want new windows appended rather than promoted to master.  


2. **Adjusting Column Widths**  
   - By default, each column might be equally wide (1/3 each for three columns, 1/2 each for two columns). You can change the ratio arrays—like `[0.4, 0.3, 0.3]`—to give 40% of the width to one column and 30% to the others.

3. **Preventing Manual Resizing**  
   - `adjust()` method has been stripped but i'm planning on working on it

4. **Consistent Window Order**  
   - The array order (`tileables[0]`, `[1]`, `[2]`, etc.) determines which window goes to which column.  
   - Make sure new windows are appended (i.e., “New Window Position” = End) so that your first window stays at index 0, second at 1, and so on. If windows appear in unexpected columns, confirm you’ve disabled “New window is master” and set “New window position” to “End.”
