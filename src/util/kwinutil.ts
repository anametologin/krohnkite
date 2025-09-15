/*
    SPDX-FileCopyrightText: 2018 Eon S. Jeon <esjeon@hyunmu.am>
    SPDX-FileCopyrightText: 2024 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>

    SPDX-License-Identifier: MIT
*/

function toQRect(rect: Rect) {
  return Qt.rect(rect.x, rect.y, rect.width, rect.height);
}

function toRect(qrect: QRect) {
  return new Rect(qrect.x, qrect.y, qrect.width, qrect.height);
}
