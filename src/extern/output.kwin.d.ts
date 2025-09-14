// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

interface Output {
  readonly geometry: QRect;
  readonly devicePixelRatio: number;
  readonly name: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly serialNumber: string;

  geometryChanged: QSignal;
  enabledChanged: QSignal;
  scaleChanged: QSignal;
  aboutToTurnOff: QSignal; // (time: number)
  wakeUp: QSignal;
  aboutToChange: QSignal; //

  mapToGlobal(pos: QPoint): QPoint;
  mapFromGlobal(pos: QPoint): QPoint;
}
