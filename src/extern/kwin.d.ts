// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

// API Reference:
//     https://techbase.kde.org/Development/Tutorials/KWin/Scripting/API_4.9
interface KWin {
  readConfig<T>(property: string, defaultValue: T): T;
  registerShortcut(
    name: string,
    desc: string,
    key: string,
    callback: Function
  ): void;
  callDBus(
    service: string,
    path: string,
    interf: string,
    method: string,
    ...args: object[]
  ): void;
  registerScreenEdge(edge: number, callback: Function): void;
  unregisterScreenEdge(edge: number): void;
  registerTouchScreenEdge(edge: number, callback: Function): void;
  unregisterTouchScreenEdge(edge: number): void;
  registerUserActionsMenu(callback: Function): void;
}

// interface IOptions {
//   configChanged: QSignal;
// }
