import { autorun, observable, computed, reaction } from "mobx";
import { DisplayObject } from "./DisplayObject";
import { InteractiveObject } from "./InteractiveObject";
import { Transform } from "../geom/Transform";
import {
  ButtonInstance,
  ButtonState,
} from "../../../internal/character/ButtonInstance";
import { rect } from "../../../internal/math/rect";
import { RenderContext } from "../../../internal/render/RenderContext";

export class SimpleButton extends InteractiveObject {
  declare __character: ButtonInstance | null;

  @observable
  __state = ButtonState.Up;

  @computed
  get __activeState() {
    switch (this.__state) {
      case ButtonState.Up:
        return this.upState;
      case ButtonState.Over:
        return this.overState;
      case ButtonState.Down:
        return this.downState;
    }
  }

  @observable
  upState = new DisplayObject();

  @observable
  overState = new DisplayObject();

  @observable
  downState = new DisplayObject();

  @observable
  hitTestState = new DisplayObject();

  @observable
  trackAsMenu = false;

  @observable
  useHandCursor = true;

  __onNewFrame() {
    this.__activeState?.__onNewFrame();
    this.hitTestState.__onNewFrame();
  }

  __doRender(ctx: RenderContext) {
    super.__doRender(ctx);
    this.__activeState?.__render(ctx);
  }

  #activateState = reaction(
    () => this.__state,
    (state) => {
      if (!this.__character) {
        return;
      }
      this.__character.instantiateState(this, state);
    }
  );

  #updateStateTransform = autorun(() => {
    let transform = this.transform;
    if (this.cacheAsBitmap) {
      transform = new Transform();
    }
    if (this.upState.transform.__update(transform)) {
      this.upState.__reportDirty();
    }
    if (this.overState.transform.__update(transform)) {
      this.overState.__reportDirty();
    }
    if (this.downState.transform.__update(transform)) {
      this.downState.__reportDirty();
    }
    if (this.hitTestState.transform.__update(transform)) {
      this.hitTestState.__reportDirty();
    }
  });

  #copyBounds = autorun(() => {
    let bounds = this.__activeState?.__bounds.__rect ?? this.__bounds.__rect;

    const changed = !rect.equals(bounds, this.__bounds.__rect);
    rect.copy(this.__bounds.__rect, bounds);
    if (changed) {
      this.__reportBoundsChanged();
    }
  });
}
