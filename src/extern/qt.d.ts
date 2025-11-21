/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

interface QObject {
  destroy(): void;
}

interface Signal<T extends Function> {
  connect(callback: T): void;
  disconnect(callback: T): void;
}

interface QTimer extends QObject {
  interval: number;
  repeat: boolean;
  running: boolean;
  triggeredOnStart: boolean;

  restart(): void;
  start(): void;
  stop(): void;

  triggered: Signal<() => void>;
}

interface ShortcutHandler {
  name: string;
  text: string;
  sequence: string;

  activated: Signal<() => void>;
}

interface DBusCall {
  dbusInterface: string;
  service: string;
  path: string;
  method: string;
  arguments: any[];

  call(): void;

  finished: Signal<(returnValue: any[]) => void>;
  failed: Signal<() => void>;
}

interface QByteArray {
  /* keep it empty for now */
}

interface QUuid {
  toString(): string;
  toByteArray(): QByteArray;
}

interface QRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface QPoint {
  x: number;
  y: number;
}

interface QSize {
  width: number;
  height: number;
}

interface QSignal {
  connect(callback: any): void;
  disconnect(callback: any): void;
}

/* Reference: http://doc.qt.io/qt-5/qml-qtqml-timer.html */
interface QQmlTimer {
  interval: number;
  repeat: boolean;
  running: boolean;
  triggeredOnStart: boolean;

  triggered: QSignal;

  restart(): void;
  start(): void;
  stop(): void;
}

declare namespace Qt {
  function createQmlObject(qml: string, parent: object, filepath?: string): any;

  function rect(x: number, y: number, width: number, height: number): QRect;
}
