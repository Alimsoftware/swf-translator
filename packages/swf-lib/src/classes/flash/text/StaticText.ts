import { mat2d, vec4 } from "gl-matrix";
import { autorun } from "mobx";
import { DisplayObject } from "../display/DisplayObject";
import { StaticTextInstance } from "../../../internal/character/StaticTextInstance";
import { RenderObjectSprite } from "../../../internal/render/objects/RenderObjectSprite";

export class StaticText extends DisplayObject {
  declare __character: StaticTextInstance | null;
  declare __renderObjects: RenderObjectSprite[];

  #updateRenderMatrix = autorun(() => {
    const matrix = this.transform.__worldMatrix.__value;
    const colorTransform = this.transform.__worldColorTransform;
    for (const obj of this.__renderObjects) {
      mat2d.copy(obj.renderMatrix, matrix);
      vec4.copy(obj.colorMul, colorTransform.__mul);
      vec4.copy(obj.colorAdd, colorTransform.__add);
    }
  });
}
