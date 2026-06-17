import { System, SystemType, SystemUpdateData } from "../../ecs/system";
import { ParticleEmitter } from "./emitter";
import ParticleSpriteCreator from "../sprite-creators/particleSpriteCreator";

/**
 * ParticleEmitterSystem is responsible for updating ParticleEmitter components.
 *
 * It handles the lifetime of the emitters and disables them when their lifetime expires.
 *
 * Actual particle spawning and creation is handled by the {@link ParticleSpriteCreator}
 */
export default class ParticleEmitterSystem extends System {
  private readonly emitterLifetimes: Map<string, number> = new Map();

  constructor() {
    super(SystemType.SERVER_AND_CLIENT, new Set([ParticleEmitter]), -1, true);
  }

  public update = ({ engine, registry, entities, dt }: SystemUpdateData) => {
    for (const entity of entities) {
      const emitter = registry.get(entity, ParticleEmitter);

      if (!emitter.enabled) {
        continue;
      }

      if (emitter.enabledLifetimeMs !== -1) {
        if (!this.emitterLifetimes.has(entity) || this.emitterLifetimes.get(entity)! <= 0) {
          this.emitterLifetimes.set(entity, emitter.enabledLifetimeMs);
        }

        const remainingLifetime = this.emitterLifetimes.get(entity)! - dt * 1000;
        this.emitterLifetimes.set(entity, remainingLifetime);

        if (remainingLifetime <= 0) {
          emitter.enabled = false;
        }
      }
    }
  };
}
