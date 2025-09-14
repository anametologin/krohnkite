// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

interface VirtualDesktop {
  readonly id: string;
  readonly x11DesktopNumber: number;
  name: string;
  nameChanged(): QSignal;
  aboutToBeDestroyed(): QSignal;
}
