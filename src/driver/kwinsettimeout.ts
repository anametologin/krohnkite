// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

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
