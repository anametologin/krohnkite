// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

function isNumeric(s: string): boolean {
  if (typeof s != "string") return false;
  return !isNaN(s as any) && !isNaN(parseFloat(s));
}

function parseNumber(value: string, float = false): number | Err {
  if (!isNumeric(value)) {
    return new Err("Invalid number");
  }
  if (float) {
    return parseFloat(value);
  } else {
    return parseInt(value);
  }
}

function validateNumber(
  value: string | number,
  from?: number,
  to?: number,
  float = false
): number | Err {
  let num;
  if (typeof value === "number") {
    num = value;
  } else {
    num = parseNumber(value, float);
    if (num instanceof Err) {
      return num;
    }
  }
  if (from !== undefined && num < from) {
    return new Err(`Number must be greater than or equal to ${from}`);
  } else if (to !== undefined && num > to) {
    return new Err(`Number must be less than or equal to ${to}`);
  }
  return num;
}

function validateNumberWithDefault(
  value: string | number,
  defaultValue: number,
  errMess: string,
  from?: number,
  to?: number,
  float = false
): number {
  let num;
  const err = `validateNumber: ${errMess}. param: ${value}. Error:`;
  if (typeof value === "number") {
    num = value;
  } else {
    num = parseNumber(value, float);
    if (num instanceof Err) {
      warning(`${err}${num.toString()}`);
      return defaultValue;
    }
  }
  if (from !== undefined && num < from) {
    warning(`${err}Number must be greater than or equal to ${from}`);
    return defaultValue;
  } else if (to !== undefined && num > to) {
    warning(`${err}Number must be less than or equal to ${to}`);
    return defaultValue;
  }
  return num;
}
