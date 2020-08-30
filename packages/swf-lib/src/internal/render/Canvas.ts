export class Canvas {
  readonly canvas = document.createElement("canvas");
  #cursor = "";

  constructor() {
    this.canvas.tabIndex = 0;
    this.canvas.style.setProperty("outline", "none", "important");
  }

  get width(): number {
    return this.canvas.width;
  }
  set width(value: number) {
    this.canvas.width = value;
  }

  get height(): number {
    return this.canvas.height;
  }
  set height(value: number) {
    this.canvas.height = value;
  }

  get cursor(): string {
    return this.#cursor;
  }

  set cursor(value: string) {
    if (value !== this.#cursor) {
      this.canvas.style.cursor = value;
      this.#cursor = value;
    }
  }

  getContext(): WebGL2RenderingContext {
    const ctx = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!ctx) {
      throw new Error("Cannot create context");
    }
    return ctx;
  }
}
