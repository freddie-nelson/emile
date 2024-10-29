import { EngineOptions } from "@engine/src/engine";
import { Vec2 } from "@engine/src/math/vec";

export const sharedEngineOptions: Partial<EngineOptions> = {
  gravity: new Vec2(0, 0),
};
