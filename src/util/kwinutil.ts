// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

function toQRect(rect: Rect) {
  return Qt.rect(rect.x, rect.y, rect.width, rect.height);
}

function toRect(qrect: QRect) {
  return new Rect(qrect.x, qrect.y, qrect.width, qrect.height);
}
