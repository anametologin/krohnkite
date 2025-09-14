// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

interface Workspace {
  readonly desktops: Output[];
  readonly desktopGridSize: QSize;
  readonly desktopGridWidth: number;
  readonly desktopGridHeight: number;
  readonly workspaceWidth: number;
  readonly workspaceHeight: number;
  readonly workspaceSize: QSize;
  readonly activeScreen: Output;
  readonly screens: Output[];
  readonly activities: string[];
  readonly virtualScreenSize: QSize;
  readonly virtualScreenGeometry: QRect;
  readonly stackingOrder: Window[];
  readonly cursorPos: QPoint;
  // read-write props
  currentDesktop: VirtualDesktop;
  activeWindow: Window;
  currentActivity: string;
  // signals
  windowAdded: QSignal; // (window: IWindow)
  windowRemoved: QSignal; // (window: IWindow
  windowActivated: QSignal; // (window: IWindow)
  desktopsChanged: QSignal;
  desktopLayoutChanged: QSignal;
  screensChanged: QSignal;
  currentActivityChanged: QSignal; // (activity new. const id: string)
  activitiesChanged: QSignal; // (activity new. const id: string)
  activityAdded: QSignal; // (activity new. const id: string)
  activityRemoved: QSignal; // (activity new. const id: string)
  virtualScreenSizeChanged: QSignal;
  virtualScreenGeometryChanged: QSignal;
  currentDesktopChanged: QSignal; // (desktop: IVirtualDesktop)
  cursorPosChanged: QSignal;
  // slots
  slotSwitchDesktopNext(): void;
  slotSwitchDesktopPrevious(): void;
  slotSwitchDesktopRight(): void;
  slotSwitchDesktopLeft(): void;
  slotSwitchDesktopUp(): void;
  slotSwitchDesktopDown(): void;
  slotSwitchToNextScreen(): void;
  slotSwitchToPrevScreen(): void;
  slotSwitchToRightScreen(): void;
  slotSwitchToLeftScreen(): void;
  slotSwitchToAboveScreen(): void;
  slotSwitchToBelowScreen(): void;
  slotWindowToNextScreen(): void;
  slotWindowToPrevScreen(): void;
  slotWindowToRightScreen(): void;
  slotWindowToLeftScreen(): void;
  slotWindowToAboveScreen(): void;
  slotWindowToBelowScreen(): void;
  slotToggleShowDesktop(): void;
  slotWindowMaximize(): void;
  slotWindowMaximizeVertical(): void;
  slotWindowMaximizeHorizontal(): void;
  slotWindowMinimize(): void;
  slotWindowShade(): void;
  slotWindowRaise(): void;
  slotWindowLower(): void;
  slotWindowRaiseOrLower(): void;
  slotActivateAttentionWindow(): void;
  slotWindowMoveLeft(): void;
  slotWindowMoveRight(): void;
  slotWindowMoveUp(): void;
  slotWindowMoveDown(): void;
  slotWindowExpandHorizontal(): void;
  slotWindowExpandVertical(): void;
  slotWindowShrinkHorizontal(): void;
  slotWindowShrinkVertical(): void;
  slotWindowQuickTileLeft(): void;
  slotWindowQuickTileRight(): void;
  slotWindowQuickTileTop(): void;
  slotWindowQuickTileBottom(): void;
  slotWindowQuickTileTopLeft(): void;
  slotWindowQuickTileTopRight(): void;
  slotWindowQuickTileBottomLeft(): void;
  slotWindowQuickTileBottomRight(): void;
  slotSwitchWindowUp(): void;
  slotSwitchWindowDown(): void;
  slotSwitchWindowRight(): void;
  slotSwitchWindowLeft(): void;
  slotIncreaseWindowOpacity(): void;
  slotLowerWindowOpacity(): void;
  slotWindowOperations(): void;
  slotWindowClose(): void;
  slotWindowMove(): void;
  slotWindowResize(): void;
  slotWindowAbove(): void;
  slotWindowBelow(): void;
  slotWindowOnAllDesktops(): void;
  slotWindowFullScreen(): void;
  slotWindowNoBorder(): void;
  slotWindowToNextDesktop(): void;
  slotWindowToPreviousDesktop(): void;
  slotWindowToDesktopRight(): void;
  slotWindowToDesktopLeft(): void;
  slotWindowToDesktopUp(): void;
  slotWindowToDesktopDown(): void;
  // functions
  sendClientToScreen(client: Window, output: Output): void;
  showOutline(geometry: QRect): void;
  showOutline(x: number, y: number, width: number, height: number): void;
  hideOutline(): void;
  screenAt(pos: QPoint): Output;
  clientArea(
    option: ClientAreaOption,
    output: Output,
    desktop: VirtualDesktop
  ): QRect;
  clientArea(option: ClientAreaOption, window: Window): QRect;
  createDesktop(position: number, name: string): void;
  removeDesktop(desktop: VirtualDesktop): void;
  supportInformation(): string;
  raiseWindow(window: Window): void;
  getClient(windowId: number): Window;
  windowAt(pos: QPoint, count: number): Window[];
  isEffectActive(pluginId: string): boolean;
}
