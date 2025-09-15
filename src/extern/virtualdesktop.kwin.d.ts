/*
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

interface VirtualDesktop {
  readonly id: string;
  readonly x11DesktopNumber: number;
  name: string;
  nameChanged(): QSignal;
  aboutToBeDestroyed(): QSignal;
}
