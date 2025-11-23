/*
    SPDX-FileCopyrightText: 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class DBusManager implements IDBus {
  isConnected: boolean = false;
  private existsCall: DBusCall;
  private _dBusMoveMouseToFocus: DBusCall;
  private _dBusMoveMouseToCenter: DBusCall;
  private _entered: boolean = false;

  constructor(dbusQml: IDBusQml) {
    this._dBusMoveMouseToFocus = dbusQml.getDBusMoveMouseToFocus();
    this._dBusMoveMouseToCenter = dbusQml.getDBusMoveMouseToCenter();
    this._dBusMoveMouseToCenter.finished.connect(
      this.moveMouseToFocusCallback.bind(this),
    );
    this._dBusMoveMouseToFocus.failed.connect(() => {
      LOG?.send(LogModules.dbus, "callFailed", " 'MoveMouseToFocus' failed");
    });
    this._dBusMoveMouseToCenter.failed.connect(() => {
      LOG?.send(LogModules.dbus, "callFailed", " 'MoveMouseToCenter' failed");
    });
    this.existsCall = dbusQml.getDBusExists();
    this.existsCall.finished.connect(this.existsCallback.bind(this));
    this.existsCall.failed.connect(() => {
      warning("dbus failed");
    });
    this.existsCall.call();
  }

  private existsCallback() {
    this.isConnected = true;
    info("DBus connected");
  }
  public moveMouseToCenter(timeout?: number) {
    if (!this.isConnected) return;
    if (timeout !== undefined)
      this.setTimeout(this._dBusMoveMouseToCenter.call, timeout);
    else this._dBusMoveMouseToCenter.call();
  }

  public moveMouseToFocus(timeout?: number) {
    if (!this.isConnected) return;
    if (timeout !== undefined)
      this.setTimeout(this._dBusMoveMouseToFocus.call, timeout);
    else this._dBusMoveMouseToFocus.call();
  }

  public moveMouseToFocusCallback() {
    this.moveMouseToFocus();
  }

  private _enter(callback: () => void) {
    if (this._entered) return;

    this._entered = true;
    try {
      callback();
    } catch (e: any) {
      warning(
        `DBUSProtectFunc: Error raised line: ${e.lineNumber}. Error: ${e}`,
      );
    } finally {
      this._entered = false;
    }
  }

  private setTimeout(func: () => void, timeout: number) {
    KWinSetTimeout(() => this._enter(func), timeout);
  }
}
