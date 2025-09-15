/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class KWinTimerPool {
  public static readonly instance = new KWinTimerPool();

  public timers: QTimer[];
  public numTimers: number;

  constructor() {
    this.timers = [];
    this.numTimers = 0;
  }

  public setTimeout(func: () => void, timeout: number) {
    if (this.timers.length === 0) {
      this.numTimers++;
      LOG?.send(
        LogModules.setTimeout,
        "setTimeout/newTimer",
        `numTimers: ${this.numTimers}`
      );
    }

    const timer: QTimer =
      this.timers.pop() ||
      Qt.createQmlObject("import QtQuick 2.0; Timer {}", scriptRoot);

    const callback = () => {
      try {
        timer.triggered.disconnect(callback);
      } catch (e) {
        /* ignore */
      }
      try {
        func();
      } catch (e) {
        /* ignore */
      }
      this.timers.push(timer);
    };

    timer.interval = timeout;
    timer.repeat = false;
    timer.triggered.connect(callback);
    timer.start();
  }
}

function KWinSetTimeout(func: () => void, timeout: number) {
  KWinTimerPool.instance.setTimeout(func, timeout);
}
