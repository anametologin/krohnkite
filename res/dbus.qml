/*
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

import QtQuick;
import org.kde.kwin;

Item {
    id: dbus;

    function getDBusExists(){
        return dbusExists
    }
    DBusCall {
        id: dbusExists;

        service: "org.kde.kglobalaccel";
        path: "/KWin";
        dbusInterface: "org.kde.KWin";
        method: "activeOutputName";
    }

    function getDBusMoveMouseToFocus() {
        return moveMouseToFocus;
    }
    DBusCall {
        id: moveMouseToFocus;

        service: "org.kde.kglobalaccel";
        path: "/component/kwin";
        dbusInterface: "org.kde.kglobalaccel.Component";
        method: "invokeShortcut";
        arguments: ["MoveMouseToFocus",];
    }

    function getDBusMoveMouseToCenter() {
        return moveMouseToCenter;
    }
    DBusCall {
        id: moveMouseToCenter;

        service: "org.kde.kglobalaccel";
        path: "/component/kwin";
        dbusInterface: "org.kde.kglobalaccel.Component";
        method: "invokeShortcut";
        arguments: ["MoveMouseToCenter",];

    }

}
