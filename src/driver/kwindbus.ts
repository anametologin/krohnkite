/*
    SPDX-FileCopyrightText: 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

class DBusManager implements IDBus {
  private _isConnected: boolean = false;
  private _dBusConnectAttempts: number;
  private _existsCall: DBusCall;
  private _dBusMoveMouseToFocus: DBusCall;
  private _dBusMoveMouseToCenter: DBusCall;
  private _entered: boolean = false;

  constructor(dBusQml: IDBusQml) {
    this._dBusMoveMouseToFocus = dBusQml.getDBusMoveMouseToFocus();
    this._dBusMoveMouseToCenter = dBusQml.getDBusMoveMouseToCenter();
    this._dBusMoveMouseToCenter.finished.connect(
      this.moveMouseToFocusCallback.bind(this),
    );
    this._dBusMoveMouseToFocus.failed.connect(() => {
      LOG?.send(LogModules.dbus, "callFailed", " 'MoveMouseToFocus' failed");
    });
    this._dBusMoveMouseToCenter.failed.connect(() => {
      LOG?.send(LogModules.dbus, "callFailed", " 'MoveMouseToCenter' failed");
    });
    this._dBusConnectAttempts = 40;
    this._existsCall = dBusQml.getDBusExists();
    this._existsCall.finished.connect(this._dBusIsOn.bind(this));
    this._existsCall.failed.connect(this._checkDBusConn.bind(this));
    this._existsCall.call();
  }

  private _dBusIsOn() {
    this._isConnected = true;
    info("DBus: connected");
  }
  private _checkDBusConn() {
    if (this._dBusConnectAttempts-- > 0)
      this.setTimeout(this._existsCall.call, 500);
    else warning("DBus failed");
  }
  public moveMouseToCenter(timeout?: number) {
    if (!this._isConnected) return;
    if (timeout !== undefined)
      this.setTimeout(this._dBusMoveMouseToCenter.call, timeout);
    else this._dBusMoveMouseToCenter.call();
  }

  public moveMouseToFocus(timeout?: number) {
    if (!this._isConnected) return;
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
        `DBusProtectFunc: Error raised line: ${e.lineNumber}. Error: ${e}`,
      );
    } finally {
      this._entered = false;
    }
  }

  private setTimeout(func: () => void, timeout: number) {
    KWinSetTimeout(() => this._enter(func), timeout);
  }
}
