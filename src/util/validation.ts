// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

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
