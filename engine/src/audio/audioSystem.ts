import { System, SystemType, SystemUpdateData } from "../ecs/system";

export class AudioSystem extends System {
  constructor() {
    super(SystemType.CLIENT, new Set([]));
  }

  public update = ({ engine }: SystemUpdateData) => {
    engine.audioManager?.update();
  };
}
