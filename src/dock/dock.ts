// Copyright (c) 2025 Vjatcheslav V. Kolchkov <akl334@protonmail.ch>
// This code is licensed under MIT license (see LICENSE for details)

class Dock implements IDock {
  public renderedOutputId: string;
  public renderedTime: number | null;
  public priority: number;
  public cfg: IDockCfg;
  public position: DockPosition | null;
  public autoDock: boolean;

  constructor(cfg: IDockCfg, priority = 0) {
    this.renderedOutputId = "";
    this.renderedTime = null;
    this.priority = priority;
    this.position = null;
    this.cfg = { ...cfg };
    this.autoDock = false;
  }
  public clone(): Dock {
    let dock = new Dock(this.cfg, this.priority);
    dock.renderedOutputId = this.renderedOutputId;
    dock.renderedTime = this.renderedTime;
    dock.position = this.position;
    dock.autoDock = this.autoDock;
    return dock;
  }
}
