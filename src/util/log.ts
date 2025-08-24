// Copyright (c) 2024-2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
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

class Logging implements ILogModules {
  private _started: number;
  private _logModules: Set<LogModule>;
  private _filters: ILogFilters | null;
  private _isIncludeMode: boolean;

  public constructor(modules: [LogPartition, string[]][], filters: string[]) {
    this._isIncludeMode = true;
    this._logModules = Logging.parseModules(modules);
    this._filters = this.parseFilters(filters);
    this._started = new Date().getTime();
  }
  public send(
    module?: LogModule,
    action?: string,
    message?: string,
    filter?: ILogFilters
  ) {
    if (module !== undefined && !this.isModuleOn(module)) return;
    if (filter !== undefined) {
      if (this.isFiltered(filter)) return;
    }
    this._print(module, action, message);
  }
  public print(module?: LogModule, action?: string, message?: string) {
    this._print(module, action, message);
  }
  public isModuleOn(module: LogModule): boolean {
    return this._logModules.has(module);
  }
  private isFiltered(filter: ILogFilters): boolean {
    if (this._filters === null) return false;
    let key: keyof ILogFilters;
    for (key in filter) {
      if (this._filters[key] == null || filter[key] == null) continue;
      const isContain = KWinWindow.isContain(
        this._filters[key] as string[],
        (filter[key] as string[])[0]
      );
      if (this._isIncludeMode) {
        return isContain ? false : true;
      } else {
        return isContain ? true : false;
      }
    }
    return false;
  }
  private static parseModules(modules: [LogPartition, string[]][]) {
    let logModules: Set<LogModule> = new Set();
    for (const module of modules) {
      const userModules = Logging._logParseUserModules(module[0], module[1]);
      if (userModules !== null) {
        userModules.forEach((el) => {});
        logModules = new Set([...logModules, ...userModules]);
      }
    }
    return logModules;
  }
  private parseFilters(filters: string[]): ILogFilters | null {
    if (filters.length === 0 || (filters.length === 1 && filters[0] === ""))
      return null;
    let logFilters: ILogFilters;
    if (filters[0] !== "" && filters[0][0] === "!") {
      this._isIncludeMode = false;
      filters[0] = filters[0].slice(1);
    }
    logFilters = { winClass: null };
    for (const filter of filters) {
      const filterParts = filter.split("=");
      if (filterParts.length !== 2) {
        warning(
          `Invalid Log filter: ${filter}.Every filter have contain "=" equal sign`
        );
        continue;
      }
      if (filterParts[0].toLowerCase() === "winclass") {
        logFilters.winClass = filterParts[1].split(":");
        continue;
      }
      warning(`Unknown Log filter name:${filterParts[0]} in filter ${filter}.`);
      continue;
    }
    return logFilters;
  }

  private static _getLogModulesStr(module: LogModule): string {
    return LogModulesKeys[module - 1];
  }
  private _print(module?: LogModule, action?: string, message?: string) {
    const timestamp = (new Date().getTime() - this._started) / 1000;
    print(
      `Krohnkite.log [${timestamp}], ${
        module !== undefined ? `[${Logging._getLogModulesStr(module)}]` : ""
      } ${action !== undefined ? action : ""} ${
        message !== undefined ? message : ""
      }`
    );
  }
  private static _logParseUserModules(
    logPartition: LogPartition,
    userStr: string[]
  ): Set<LogModule> | null {
    let submodules: Set<LogModule>;
    let includeMode = true;
    if (userStr.length === 0) {
      return new Set(logPartition.modules);
    }
    if (userStr[0] !== "" && userStr[0][0] === "!") {
      includeMode = false;
      userStr[0] = userStr[0].substring(1);
      submodules = new Set(logPartition.modules);
    } else {
      submodules = new Set<LogModule>();
    }

    for (let moduleStr of userStr) {
      if (moduleStr.includes("-")) {
        const range = moduleStr.split("-");
        if (range.length !== 2) {
          warning(
            `Invalid module range:${range} in ${moduleStr}, ignoring module ${logPartition.name} `
          );
          return null;
        }
        const start = validateNumber(range[0]);
        let end: number | Err;
        if (range[1] === "") {
          end = logPartition.modules.length;
        } else {
          end = validateNumber(range[1]);
        }
        if (start instanceof Err || end instanceof Err) {
          let err = start instanceof Err ? start : end;
          warning(
            `Invalid module number: ${err} in ${moduleStr}, ignoring module ${logPartition.name}`
          );
          return null;
        }
        if (start > end || start < 1) {
          warning(
            `Invalid module range:${range}. The start must be less than end and both must be greater than zero. Module string: ${moduleStr}, ignoring module ${logPartition.name} `
          );
          return null;
        }
        if (end > logPartition.modules.length) {
          warning(
            `Invalid module range:${range}. The end must be less than or equal to the number of submodules:${logPartition.modules.length} in the module. Module string: ${moduleStr}, ignoring module ${logPartition.name} `
          );
          return null;
        }
        if (includeMode) {
          for (let i = start - 1; i < end; i++) {
            submodules.add(logPartition.modules[i]);
          }
        } else {
          for (let i = start - 1; i < end; i++) {
            submodules.delete(logPartition.modules[i]);
          }
        }
      } else {
        let moduleNumber: number | Err = validateNumber(moduleStr);
        if (moduleNumber instanceof Err) {
          warning(
            `Invalid module number:${moduleNumber}. The module number must be a number. Module string: ${moduleStr}, ignoring module ${logPartition.name} `
          );
          return null;
        }
        if (moduleNumber < 1 || moduleNumber > logPartition.modules.length) {
          warning(
            `Invalid module number:${moduleNumber}. The module number must be >=1 and <= number of submodules:${logPartition.modules.length}. Module string: ${moduleStr}, ignoring module ${logPartition.name} `
          );
          return null;
        }
        if (includeMode) {
          submodules.add(logPartition.modules[moduleNumber - 1]);
        } else {
          submodules.delete(logPartition.modules[moduleNumber - 1]);
        }
      }
    }
    return submodules;
  }
}
