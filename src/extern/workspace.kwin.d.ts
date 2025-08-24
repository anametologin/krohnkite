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
  slotWindowToAboveScreen(): void;
  slotWindowToBelowScreen(): void;
  slotWindowToNextScreen(): void;
  slotWindowToPrevScreen(): void;
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
