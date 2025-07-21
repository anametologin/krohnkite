import QtQuick;
import org.kde.kwin;

Item {
    id: dbus;
    function getToggleDock() {
        return toggleDock;
    }
    ShortcutHandler {
        id: toggleDock;

        name: "KrohnkiteToggleDock";
        text: "Krohnkite: Toggle Dock";
        sequence: "";
    }

    function getFocusNext() {
        return focusNext;
    }
    ShortcutHandler {
        id: focusNext;

        name: "KrohnkiteFocusNext";
        text: "Krohnkite: Focus Next";
        sequence: "Meta+.";
    }
    function getFocusPrev() {
        return focusPrev;
    }
    ShortcutHandler {
        id: focusPrev;

        name: "KrohnkiteFocusPrev";
        text: "Krohnkite: Focus Previous";
        sequence: "Meta+,";
    }

    function getFocusDown() {
        return focusDown;
    }
    ShortcutHandler {
        id: focusDown;

        name: "KrohnkiteFocusDown";
        text: "Krohnkite: Focus Down";
        sequence: "Meta+J";
    }
    function getFocusUp() {
        return focusUp;
    }
    ShortcutHandler {
        id: focusUp;

        name: "KrohnkiteFocusUp";
        text: "Krohnkite: Focus Up";
        sequence: "Meta+K";
    }
    function getFocusLeft() {
        return focusLeft;
    }
    ShortcutHandler {
        id: focusLeft;

        name: "KrohnkiteFocusLeft";
        text: "Krohnkite: Focus Left";
        sequence: "Meta+H";
    }
    function getFocusRight() {
        return focusRight;
    }
    ShortcutHandler {
        id: focusRight;

        name: "KrohnkiteFocusRight";
        text: "Krohnkite: Focus Right";
        sequence: "Meta+L";
    }
    function getShiftDown() {
        return shiftDown;
    }
    ShortcutHandler {
        id: shiftDown;

        name: "KrohnkiteShiftDown";
        text: "Krohnkite: Move Down/Next";
        sequence: "Meta+Shift+J";
    }
    function getShiftUp() {
        return shiftUp;
    }
    ShortcutHandler {
        id: shiftUp;

        name: "KrohnkiteShiftUp";
        text: "Krohnkite: Move Up/Prev";
        sequence: "Meta+Shift+K";
    }
    function getShiftLeft() {
        return shiftLeft;
    }
    ShortcutHandler {
        id: shiftLeft;

        name: "KrohnkiteShiftLeft";
        text: "Krohnkite: Move Left";
        sequence: "Meta+Shift+H";
    }
    function getShiftRight() {
        return shiftRight;
    }
    ShortcutHandler {
        id: shiftRight;

        name: "KrohnkiteShiftRight";
        text: "Krohnkite: Move Right";
        sequence: "Meta+Shift+L";
    }
    function getGrowHeight() {
        return growHeight;
    }
    ShortcutHandler {
        id: growHeight;

        name: "KrohnkiteGrowHeight";
        text: "Krohnkite: Grow Height";
        sequence: "Meta+Ctrl+J";
    }
    function getShrinkHeight() {
        return shrinkHeight;
    }
    ShortcutHandler {
        id: shrinkHeight;

        name: "KrohnkiteShrinkHeight";
        text: "Krohnkite: Shrink Height";
        sequence: "Meta+Ctrl+K";
    }
    function getShrinkWidth() {
        return shrinkWidth;
    }
    ShortcutHandler {
        id: shrinkWidth;

        name: "KrohnkiteShrinkWidth";
        text: "Krohnkite: Shrink Width";
        sequence: "Meta+Ctrl+H";
    }
    function getGrowWidth() {
        return growWidth;
    }
    ShortcutHandler {
        id: growWidth;

        name: "KrohnkiteGrowWidth";
        text: "Krohnkite: Grow Width";
        sequence: "Meta+Ctrl+L";
    }
    function getIncrease() {
        return increase;
    }
    ShortcutHandler {
        id: increase;

        name: "KrohnkiteIncrease";
        text: "Krohnkite: Increase";
        sequence: "Meta+I";
    }
    function getDecrease() {
        return decrease;
    }
    ShortcutHandler {
        id: decrease;

        name: "KrohnkiteDecrease";
        text: "Krohnkite: Decrease";
        sequence: "Meta+D";
    }
    function getToggleFloat() {
        return toggleFloat;
    }
    ShortcutHandler {
        id: toggleFloat;

        name: "KrohnkiteToggleFloat";
        text: "Krohnkite: Toggle Float";
        sequence: "Meta+F";
    }
    function getFloatAll() {
        return floatAll;
    }
    ShortcutHandler {
        id: floatAll;

        name: "KrohnkiteFloatAll";
        text: "Krohnkite: Toggle Float All";
        sequence: "Meta+Shift+F";
    }
    function getNextLayout() {
        return nextLayout;
    }
    ShortcutHandler {
        id: nextLayout;

        name: "KrohnkiteNextLayout";
        text: "Krohnkite: Next Layout";
        sequence: "Meta+\\";
    }
    function getPreviousLayout() {
        return previousLayout;
    }
    ShortcutHandler {
        id: previousLayout;

        name: "KrohnkitePreviousLayout";
        text: "Krohnkite: Previous Layout";
        sequence: "Meta+|";
    }
    function getRotate() {
        return rotate;
    }
    ShortcutHandler {
        id: rotate;

        name: "KrohnkiteRotate";
        text: "Krohnkite: Rotate";
        sequence: "Meta+R";
    }
    function getRotatePart() {
        return rotatePart;
    }
    ShortcutHandler {
        id: rotatePart;

        name: "KrohnkiteRotatePart";
        text: "Krohnkite: Rotate Part";
        sequence: "Meta+Shift+R";
    }
    function getSetMaster() {
        return setMaster;
    }
    ShortcutHandler {
        id: setMaster;

        name: "KrohnkiteSetMaster";
        text: "Krohnkite: Set master";
        sequence: "Meta+Return";
    }
    function getTileLayout() {
        return tileLayout;
    }
    ShortcutHandler {
        id: tileLayout;

        name: "KrohnkiteTileLayout";
        text: "Krohnkite: Tile Layout";
        sequence: "Meta+T";
    }
    function getMonocleLayout() {
        return monocleLayout;
    }
    ShortcutHandler {
        id: monocleLayout;

        name: "KrohnkiteMonocleLayout";
        text: "Krohnkite: Monocle Layout";
        sequence: "Meta+M";
    }
    function getThreeColumnLayout() {
        return treeColumnLayout;
    }
    ShortcutHandler {
        id: treeColumnLayout;

        name: "KrohnkiteTreeColumnLayout";
        text: "Krohnkite: Three Column Layout";
        sequence: "";
    }
    function getSpreadLayout() {
        return spreadLayout;
    }
    ShortcutHandler {
        id: spreadLayout;

        name: "KrohnkiteSpreadLayout";
        text: "Krohnkite: Spread Layout";
        sequence: "";
    }
    function getStairLayout() {
        return stairLayout;
    }
    ShortcutHandler {
        id: stairLayout;

        name: "KrohnkiteStairLayout";
        text: "Krohnkite: Stair Layout";
        sequence: "";
    }
    function getFloatingLayout() {
        return floatingLayout;
    }
    ShortcutHandler {
        id: floatingLayout;

        name: "KrohnkiteFloatingLayout";
        text: "Krohnkite: Floating Layout";
        sequence: "";
    }
    function getQuarterLayout() {
        return quarterLayout;
    }
    ShortcutHandler {
        id: quarterLayout;

        name: "KrohnkiteQuarterLayout";
        text: "Krohnkite: Quarter Layout";
        sequence: "";
    }
    function getStackedLayout() {
        return stackedLayout;
    }
    ShortcutHandler {
        id: stackedLayout;

        name: "KrohnkiteStackedLayout";
        text: "Krohnkite: Stacked Layout";
        sequence: "";
    }
    function getBTreeLayout() {
        return bTreeLayout;
    }
    ShortcutHandler {
        id: bTreeLayout;

        name: "KrohnkiteBTreeLayout";
        text: "Krohnkite: BTree Layout";
        sequence: "";
    }
    function getSpiralLayout() {
        return spiralLayout;
    }
    ShortcutHandler {
        id: spiralLayout;

        name: "KrohnkiteSpiralLayout";
        text: "Krohnkite: Spiral Layout";
        sequence: "";
    }
    function getColumnsLayout() {
        return columnsLayout;
    }
    ShortcutHandler {
        id: columnsLayout;

        name: "KrohnkiteColumnsLayout";
        text: "Krohnkite: Columns Layout";
        sequence: "";
    }
}
