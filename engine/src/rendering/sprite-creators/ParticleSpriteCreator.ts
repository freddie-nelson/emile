import { Entity, EntityQuery } from "../../ecs/entity";
import { Transform } from "../../core/transform";
import { ParticleEmitter, ParticleType } from "../particles/emitter";
import { Vec2 } from "../../math/vec";
import { SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Container, Graphics, Sprite, Texture, TextureSource } from "pixi.js";
import Engine, { CLIENT_LERP_RATE } from "../../engine";
import { lerp, lerpColor } from "../../math/lerp";
import vary from "../../math/vary";
import { map, max, min } from "../../math/clamp";
import SpriteSpriteCreator, { SpriteImage } from "./SpriteSpriteCreator";
import { Logger } from "@shared/src/Logger";
import { graphicsToTexture } from "../helpers/texture";
import { Registry } from "../../ecs/registry";

interface ParticleState {
  lifetime: number;
  life: number;
  speed: Vec2;
  rotateSpeed: number;
  scaleRate: Vec2;
  acceleration: Vec2;
  rotationAcceleration: number;
  endSize: number;
  particle: Sprite;
}

interface ParticleEmitterState {
  emitter: ParticleEmitter;
  container: Container;
  particles: Set<ParticleState>;
  emitTimer: number;
  emitThisInterval: number;
  emitBudget: number;
  emitEveryMs: number;
}

/**
 * Sprite creator for particle emitter entities.
 *
 * This creator will create and emit particles based on the settings of the particle emitter component.
 *
 * If you are using any sprite particle emitters, you must provide a sprite map to the constructor. You then must also call `preloadTextures` before using the creator.
 */
export default class ParticleSpriteCreator extends SpriteSpriteCreator {
  private readonly emitters: Map<string, ParticleEmitterState> = new Map();
  private squareTexture?: Texture<TextureSource<any>>;
  private circleTexture?: Texture<TextureSource<any>>;

  constructor(spriteMap?: Map<number, SpriteImage>) {
    super(spriteMap);

    this.query = new Set([Transform, ParticleEmitter]) as EntityQuery;
  }

  public readonly create: SpriteCreatorCreate = ({ registry, world, entity, app }) => {
    if (!this.squareTexture) {
      this.squareTexture = graphicsToTexture(app.renderer, new Graphics().rect(0, 0, 20, 20).fill(0xffffff));
      this.circleTexture = graphicsToTexture(app.renderer, new Graphics().circle(0, 0, 10).fill(0xffffff));
    }

    const e = registry.get(entity);

    const transform = Entity.getComponent(e, Transform);
    const emitter = Entity.getComponent(e, ParticleEmitter);

    const c = new Container();
    world.addChild(c);

    c.position.set(transform.position.x, transform.position.y);
    c.rotation = transform.rotation;
    c.scale.set(transform.scale.x, transform.scale.y);
    c.zIndex = transform.zIndex;

    this.emitters.set(entity, {
      emitter,
      container: c,
      particles: new Set(),
      emitTimer: 0,
      emitThisInterval: 0,
      emitBudget: 0,
      emitEveryMs: 0,
    });

    return c;
  };

  public readonly update: SpriteCreatorUpdate = ({ engine, registry, entity, sprite, dt }) => {
    const e = registry.get(entity);
    const c = sprite! as Container;

    const transform = Entity.getComponent(e, Transform);
    const emitter = Entity.getComponent(e, ParticleEmitter);

    const position = Vec2.lerp(new Vec2(c.position.x, c.position.y), transform.position, CLIENT_LERP_RATE);
    c.position.set(position.x, position.y);

    c.rotation = lerp(c.rotation, transform.rotation, CLIENT_LERP_RATE);
    c.scale.set(transform.scale.x, transform.scale.y);
    c.zIndex = transform.zIndex;

    this.updateEmitter(entity, dt, engine);
  };

  public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }) => {
    sprite!.removeFromParent();
    sprite!.destroy();

    this.emitters.delete(entity);
  };

  private updateEmitter(entity: string, dt: number, engine: Engine) {
    const state = this.emitters.get(entity)!;
    const { emitter, container, particles } = state;

    const dtMs = Math.floor(dt * 1000);
    const gravity = engine.physics.getGravity();

    for (const particle of particles) {
      if (particle.life <= 0) {
        container.removeChild(particle.particle);
        particles.delete(particle);
        continue;
      }

      this.updateParticle(emitter, particle, Vec2.mul(gravity, emitter.gravityScale), dt, dtMs);
    }

    if (!emitter.enabled) {
      return;
    }

    // emit new particles
    if (state.emitTimer <= 0) {
      state.emitThisInterval = max(
        0,
        vary(emitter.particleEmitRatePerSecond, emitter.particleEmitRatePerSecondVariance)
      );
      state.emitTimer = 1000;
      state.emitEveryMs = Math.floor(1000 / state.emitThisInterval);
    }

    state.emitTimer -= dtMs;
    state.emitBudget += min(dtMs, 1000);

    // check if we can emit new particles
    if (state.emitThisInterval <= 0 || particles.size >= emitter.maxParticles) {
      return;
    }

    const texture = this.getParticleTexture(emitter);
    if (!texture) {
      return Logger.errorAndThrow("RENDERER", "Particle texture not found.");
    }

    while (state.emitBudget >= state.emitEveryMs && particles.size < emitter.maxParticles) {
      state.emitBudget -= state.emitEveryMs;

      const p = this.createParticle(emitter, texture);
      container.addChild(p.particle);
      particles.add(p);
    }
  }

  private calculateParticleColor(emitter: ParticleEmitter, t: number) {
    if (emitter.particleColorStops.length === 0) {
      return [emitter.particleStartColor, emitter.particleStartAlpha];
    }

    let startColor = emitter.particleStartColor;
    let startAlpha = emitter.particleStartAlpha;
    let endColor = emitter.particleStartColor;
    let endAlpha = emitter.particleStartAlpha;

    for (let i = 0; i < emitter.particleColorStops.length; i++) {
      const stop = emitter.particleColorStops[i];

      endColor = stop.color;
      endAlpha = stop.alpha;

      if (t < stop.time) {
        break;
      }

      startColor = stop.color;
      startAlpha = stop.alpha;
    }

    return [lerpColor(startColor, endColor, t), lerp(startAlpha, endAlpha, t)];
  }

  private getParticleTexture(emitter: ParticleEmitter) {
    if (emitter.particleType === ParticleType.SPRITE) {
      const texture = this.getTextureFromType(emitter.particleSpriteType);
      if (!texture) {
        return Logger.errorAndThrow(
          "RENDERER",
          `Particle sprite type '${emitter.particleSpriteType}' not found in sprite map.`
        );
      }
      if (Array.isArray(texture)) {
        return Logger.errorAndThrow(
          "RENDERER",
          `Particle sprite type '${emitter.particleSpriteType}' is an array, expected single texture.`
        );
      }

      return texture;
    } else if (emitter.particleType === ParticleType.SQUARE) {
      return this.squareTexture!;
    } else if (emitter.particleType === ParticleType.CIRCLE) {
      return this.circleTexture!;
    } else {
      return Logger.errorAndThrow("RENDERER", `Unsupported particle type: ${emitter.particleType}`);
    }
  }

  private createParticle(emitter: ParticleEmitter, texture: Texture<TextureSource<any>>): ParticleState {
    const size = vary(emitter.particleStartSize, emitter.particleStartSizeVariance);
    const width = size;
    const height =
      emitter.particleType === ParticleType.SPRITE ? (texture.height / texture.width) * size : size;

    const x = vary(emitter.particleStartOffsetX, emitter.particleStartOffsetXVariance);
    const y = vary(emitter.particleStartOffsetY, emitter.particleStartOffsetYVariance);
    const rotation = vary(emitter.particleStartRotation, emitter.particleStartRotationVariance);

    const [tint, alpha] = this.calculateParticleColor(emitter, 0);

    const p = new Sprite({
      texture,
      width,
      height,
      x,
      y,
      rotation,
      tint,
      alpha,
      scale: 1,
      anchor: 0.5,
    });

    const angle = vary(emitter.particleStartDirAngle, emitter.particleStartDirVariance);
    const dir = Vec2.fromAngle(angle);

    const speed = Vec2.mul(
      Vec2.fromAngle(angle),
      vary(emitter.particleStartSpeed, emitter.particleStartSpeedVariance)
    );
    const rotateSpeed = vary(emitter.particleRotateSpeed, emitter.particleRotateSpeed);
    const acceleration = Vec2.mul(
      dir,
      vary(emitter.particleAcceleration, emitter.particleAccelerationVariance)
    );
    const rotationAcceleration = vary(
      emitter.particleRotateAcceleration,
      emitter.particleRotateAccelerationVariance
    );
    const scaleRate = new Vec2(
      vary(emitter.particleScaleXRate, emitter.particleScaleXRateVariance),
      vary(emitter.particleScaleYRate, emitter.particleScaleYRateVariance)
    );

    const lifetime = vary(emitter.particleLifetimeMs, emitter.particleLifetimeVarianceMs);

    return {
      lifetime,
      life: lifetime,
      speed,
      rotateSpeed,
      scaleRate,
      acceleration,
      rotationAcceleration,
      particle: p,
      endSize:
        emitter.particleEndSize >= 0 ? vary(emitter.particleEndSize, emitter.particleEndSizeVariance) : -1,
    };
  }

  private updateParticle(
    emitter: ParticleEmitter,
    particle: ParticleState,
    gravity: Vec2,
    dt: number,
    dtMs: number
  ) {
    // decrement lifetime
    particle.life -= dtMs;

    const t = 1 - particle.life / particle.lifetime;

    // update particle positional properties
    particle.particle.x += particle.speed.x * dt;
    particle.particle.y += particle.speed.y * dt;

    particle.particle.rotation += particle.rotateSpeed * dt;

    if (particle.endSize >= 0 && t >= emitter.particleStartSizeInterpolationT) {
      const sizeT = map(t, emitter.particleStartSizeInterpolationT, 1, 0, 1);

      particle.particle.width = lerp(particle.particle.width, particle.endSize, sizeT);
      particle.particle.height = lerp(particle.particle.height, particle.endSize, sizeT);
    } else if (emitter.particleEnableExponentialScaleRate) {
      particle.particle.scale.x +=
        (particle.particle.scale.x * particle.scaleRate.x - particle.particle.scale.x) * dt;
      particle.particle.scale.y +=
        (particle.particle.scale.y * particle.scaleRate.y - particle.particle.scale.y) * dt;
    } else {
      particle.particle.scale.x += particle.scaleRate.x * dt;
      particle.particle.scale.x += particle.scaleRate.y * dt;
    }

    particle.speed.x += (particle.acceleration.x + gravity.x) * dt;
    particle.speed.y += (particle.acceleration.y + gravity.y) * dt;

    particle.rotateSpeed += particle.rotationAcceleration * dt;

    // update particle properties
    const [color, alpha] = this.calculateParticleColor(emitter, t);
    particle.particle.tint = color;
    particle.particle.alpha = alpha;
  }
}
