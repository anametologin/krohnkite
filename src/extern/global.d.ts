// Copyright (c) 2018 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

/* KWin global objects */
// declare var workspace: Workspace;
declare var KWIN: KWin;
// declare var shortcuts: IShortcuts;
declare function print(s: string): void;
// declare function readConfig(params: any): void;

interface Api {
  workspace: Workspace;
  kwin: KWin;
  shortcuts: IShortcuts;
}
declare var KWINCONFIG: KWinConfig;
/* QML objects */
declare var activityInfo: Plasma.TaskManager.ActivityInfo;
declare var mousePoller: Plasma.PlasmaCore.DataSource;
declare var scriptRoot: object;

interface PopupDialog {
  show(text: string, duration: number): void;
}
declare var popupDialog: PopupDialog;

/* Common Javascript globals */
declare let console: any;
declare let setTimeout: any;
