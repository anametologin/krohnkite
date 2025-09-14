// Copyright (c) 2018-2019 Eon S. Jeon <esjeon@hyunmu.am>
// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class Err {
  public error: string;
  constructor(s: string) {
    this.error = s;
  }

  public toString(): string {
    return `${this.error}`;
  }
}
function warning(s: string) {
  print(`Krohnkite.WARNING: ${s}`);
}

function clip(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function slide(value: number, step: number): number {
  if (step === 0) return value;
  return Math.floor(value / step + 1.000001) * step;
}

function matchWords(str: string, words: string[]): number {
  for (let i = 0; i < words.length; i++) {
    if (str.indexOf(words[i]) >= 0) return i;
  }
  return -1;
}

function wrapIndex(index: number, length: number): number {
  if (index < 0) return index + length;
  if (index >= length) return index - length;
  return index;
}

function getRandomInt(max: number, signed = false): number {
  const randomNumber = Math.floor(Math.random() * max);
  if (signed && Math.random() < 0.5) return -randomNumber;
  return randomNumber;
}
/**
 * Partition the given array into two parts, based on the value of the predicate
 *
 * @param array
 * @param predicate A function which accepts an item and returns a boolean value.
 * @return A tuple containing an array of true(matched) items, and an array of false(unmatched) items.
 */
function partitionArray<T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): [T[], T[]] {
  return array.reduce(
    (parts: [T[], T[]], item: T, index: number) => {
      parts[predicate(item, index) ? 0 : 1].push(item);
      return parts;
    },
    [[], []]
  );
}

/**
 * Partition the array into chunks of designated sizes.
 *
 * This function splits the given array into N+1 chunks, where N chunks are
 * specified by `sizes`, and the additional chunk is for remaining items. When
 * the array runs out of items first, any remaining chunks will be empty.
 * @param array
 * @param sizes     A list of chunk sizes
 * @returns An array of (N+1) chunks, where the last chunk contains remaining
 * items.
 */
function partitionArrayBySizes<T>(array: T[], sizes: number[]): T[][] {
  let base = 0;
  const chunks = sizes.map((size): T[] => {
    const chunk = array.slice(base, base + size);
    base += size;
    return chunk;
  });
  chunks.push(array.slice(base));

  return chunks;
}

/**
 * Tests if two ranges are overlapping
 * @param min1 Range 1, begin
 * @param max1 Range 1, end
 * @param min2 Range 2, begin
 * @param max2 Range 2, end
 */
function overlap(
  min1: number,
  max1: number,
  min2: number,
  max2: number
): boolean {
  const min = Math.min;
  const max = Math.max;
  const dx = max(0, min(max1, max2) - max(min1, min2));
  return dx > 0;
}

class SurfaceCfg<SurfaceCfgType> {
  public outputName: string;
  public activityId: string;
  public vDesktopName: string;
  public cfg: SurfaceCfgType;

  constructor(
    outputName: string,
    activityId: string,
    vDesktopName: string,
    cfg: SurfaceCfgType
  ) {
    this.outputName = outputName;
    this.activityId = activityId;
    this.vDesktopName = vDesktopName;
    this.cfg = cfg;
  }
  public isFit(
    output: Output,
    activity: string,
    vDesktop: VirtualDesktop
  ): boolean {
    return (
      (this.outputName === "" || this.outputName === output.name) &&
      (this.activityId === "" || this.activityId === activity) &&
      (this.vDesktopName === "" || this.vDesktopName === vDesktop.name)
    );
  }
  public toString(): string {
    return `Surface: Output Name: ${this.outputName}, Activity ID: ${this.activityId}, Virtual Desktop Name: ${this.vDesktopName} cfg: ${this.cfg}`;
  }
}

/**
 * Parse surfaceId like: HDMI-A-1@f381c9cf-cb90-4ade-8b3f-24ae0002d366#Desktop 1
 * @param Config Surfaces. textbox splited to list of string
 * @return a list of objects containing outputName,activityId,vDesktopName, unvalidated user config)
 */
interface IUnvalidatedSurfaceCfg {
  outputName: string;
  activityId: string;
  vDesktopName: string;
  unvalidatedCfg: string[];
}

function getSurfacesCfg(userConfig: string[]): IUnvalidatedSurfaceCfg[] {
  let surfacesCfg: IUnvalidatedSurfaceCfg[] = [];
  if (userConfig.length === 0) return surfacesCfg;
  userConfig.forEach((cfg) => {
    let surfaceCfgString = cfg.split(":").map((part) => part.trim());
    if (surfaceCfgString.length !== 4) {
      warning(
        `Invalid User surface config: ${cfg}, config must have three colons`
      );
      return;
    }
    surfacesCfg.push({
      outputName: surfaceCfgString[0],
      activityId: surfaceCfgString[1],
      vDesktopName: surfaceCfgString[2],
      unvalidatedCfg: surfaceCfgString[3]
        .split(",")
        .map((part) => part.trim().toLowerCase()),
    } as IUnvalidatedSurfaceCfg);
  });

  return surfacesCfg;
}

function surfaceIdParse(id: string): [string, string, string] {
  let i1 = id.indexOf("@");
  let i2 = id.indexOf("#");

  let outputName = i1 !== -1 ? id.slice(0, i1) : id;
  let activity = i1 !== -1 && i2 !== -1 ? id.slice(i1 + 1, i2) : "";
  let desktopName = i2 !== -1 ? id.slice(i2 + 1) : "";

  return [outputName, activity, desktopName];
}
/**
 * Get current function name
 * @returns string | undefined
 */
function getMethodName(): string {
  var err = new Error();
  return `${err.stack?.split("\n")[1].split("@")[0]}`;
}

function unCapitalize(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
