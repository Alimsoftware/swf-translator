import { vec4 } from "gl-matrix";
import { Signal } from "../../signal";

export class GLState {
  readonly gl: WebGL2RenderingContext;
  readonly contextLost = new Signal();
  hasContext = true;

  maxTextures: number = 1;
  readonly clearColor = vec4.create();
  readonly viewport = vec4.create();
  readonly bindings = new Map<GLenum, unknown>();
  readonly textureUnits = new Map<number, WebGLTexture | null>();
  activeTexture: GLenum = 0;
  vertexArray: WebGLVertexArrayObject | null = null;
  program: WebGLProgram | null = null;
  capacity: number = 0;
  readonly blendEquation: [GLenum, GLenum] = [0, 0];
  readonly blendFuncs: [GLenum, GLenum, GLenum, GLenum] = [0, 0, 0, 0];

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly attrs: WebGLContextAttributes
  ) {
    const gl = canvas.getContext("webgl2", attrs);
    if (!gl) {
      throw new Error("Cannot create WebGL2 context");
    }
    this.gl = gl;
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.contextLost.emit();
        this.hasContext = false;
      },
      false
    );
    canvas.addEventListener(
      "webglcontextrestored",
      (e) => {
        e.preventDefault();
        this.hasContext = true;
        this.reset();
      },
      false
    );

    this.reset();
  }

  reset() {
    this.maxTextures = Math.min(
      16,
      this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS)
    );
    vec4.set(this.clearColor, 0, 0, 0, 0);
    vec4.set(this.viewport, 0, 0, 0, 0);
    this.bindings.clear();
    this.textureUnits.clear();
    this.activeTexture = 0;
    this.vertexArray = null;
    this.program = null;
    this.capacity = 0;
    this.blendEquation.fill(0);
    this.blendFuncs.fill(0);
  }

  // FIXME: Disabled bound texture unit memorization since it's crashy on macOS.
  // ref: https://stackoverflow.com/questions/34277156/webgl-on-osx-using-wrong-texture-in-all-browsers
  bindTexture(unit: number, texture: WebGLTexture | null) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.textureUnits.set(unit, texture);
  }

  bindTextures(textures: (WebGLTexture | null)[]): GLenum[] {
    return textures.map((tex, i) => {
      this.bindTexture(i, tex);
      return i;
    });
  }

  bindBuffer(target: GLenum, buffer: WebGLBuffer | null) {
    if (this.bindings.get(target) === buffer) {
      return;
    }
    this.gl.bindBuffer(target, buffer);
    this.bindings.set(target, buffer);
  }

  bindVertexArray(va: WebGLVertexArrayObject | null) {
    if (this.vertexArray === va) {
      return;
    }
    this.gl.bindVertexArray(va);
    this.vertexArray = va;
    this.bindings.clear();
  }

  bindRenderbuffer(target: GLenum, renderbuffer: WebGLRenderbuffer | null) {
    if (this.bindings.get(target) === renderbuffer) {
      return;
    }
    this.gl.bindRenderbuffer(target, renderbuffer);
    this.bindings.set(target, renderbuffer);
  }

  bindFramebuffer(target: GLenum, framebuffer: WebGLFramebuffer | null) {
    if (this.bindings.get(target) === framebuffer) {
      return;
    }
    this.gl.bindFramebuffer(target, framebuffer);
    this.bindings.set(target, framebuffer);
    if (target === this.gl.FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, framebuffer);
      this.bindings.set(this.gl.READ_FRAMEBUFFER, framebuffer);
      this.bindings.set(this.gl.DRAW_FRAMEBUFFER, framebuffer);
    } else if (target === this.gl.READ_FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, undefined);
      this.bindings.set(this.gl.READ_FRAMEBUFFER, framebuffer);
    } else if (target === this.gl.DRAW_FRAMEBUFFER) {
      this.bindings.set(this.gl.FRAMEBUFFER, undefined);
      this.bindings.set(this.gl.DRAW_FRAMEBUFFER, framebuffer);
    }
  }

  useProgram(program: WebGLProgram | null) {
    if (this.program === program) {
      return;
    }
    this.gl.useProgram(program);
    this.program = program;
  }

  setActiveTexture(texture: GLenum) {
    if (this.activeTexture === texture) {
      return;
    }
    this.gl.activeTexture(texture);
    this.activeTexture = texture;
  }

  setClearColor(red: number, green: number, blue: number, alpha: number) {
    if (vec4.equals(this.clearColor, [red, green, blue, alpha])) {
      return;
    }
    this.gl.clearColor(red, green, blue, alpha);
    vec4.set(this.clearColor, red, green, blue, alpha);
  }

  setViewport(x: number, y: number, width: number, height: number) {
    if (vec4.equals(this.viewport, [x, y, width, height])) {
      return;
    }
    this.gl.viewport(x, y, width, height);
    vec4.set(this.viewport, x, y, width, height);
  }

  enable(cap: GLenum) {
    if ((this.capacity | cap) === this.capacity) {
      return;
    }
    this.gl.enable(cap);
    this.capacity |= cap;
  }

  disable(cap: GLenum) {
    if ((this.capacity & ~cap) === this.capacity) {
      return;
    }
    this.gl.disable(cap);
    this.capacity &= ~cap;
  }

  setBlendEquation(modeRGB: GLenum, modeAlpha: GLenum = modeRGB) {
    if (
      this.blendEquation[0] === modeRGB &&
      this.blendEquation[1] === modeAlpha
    ) {
      return;
    }
    this.gl.blendEquationSeparate(modeRGB, modeAlpha);
    this.blendEquation[0] = modeRGB;
    this.blendEquation[1] = modeAlpha;
  }

  setBlendFunc(
    srcRGB: GLenum,
    dstRGB: GLenum,
    srcAlpha: GLenum = srcRGB,
    dstAlpha: GLenum = dstRGB
  ) {
    if (
      this.blendFuncs[0] === srcRGB &&
      this.blendFuncs[1] === dstRGB &&
      this.blendFuncs[2] === srcAlpha &&
      this.blendFuncs[3] === dstAlpha
    ) {
      return;
    }
    this.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    this.blendFuncs[0] = srcRGB;
    this.blendFuncs[1] = dstRGB;
    this.blendFuncs[2] = srcAlpha;
    this.blendFuncs[3] = dstAlpha;
  }
}
