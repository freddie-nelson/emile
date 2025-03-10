import { ArraySchema, Schema, type } from "@colyseus/schema";
import { Component } from "../../ecs/component";
import { SpriteTag } from "../spriteTag";

export enum ParticleType {
  SPRITE = 0,
  CIRCLE = 1,
  SQUARE = 2,
}

export class ParticleEmitterColorStop extends Schema {
  /**
   * The percentage of the lifetime of the particle at which this color and alpha should be reached.
   *
   * This should be a value between 0 and 1 (inclusive).
   */
  @type("float32") public time: number = 0;

  /**
   * The color of the particle at this time.
   */
  @type("number") public color: number = 0xffffff;

  /**
   * The alpha of the particle at this time.
   *
   * This should be a value between 0 and 1 (inclusive).
   */
  @type("float32") public alpha: number = 1;
}

/**
 * A component that represents a particle emitter.
 *
 * This component is used to emit particles from an entity, using the particle system.
 */
export class ParticleEmitter extends Component {
  public static readonly COMPONENT_ID: number = 200;

  /**
   * Whether the particle emitter is enabled.
   *
   * When disabled, the particle emitter will not emit any particles.
   *
   * When enabled, the particle emitter will emit particles based on the settings.
   */
  @type("boolean") public enabled: boolean = true;

  /**
   * The scale factor of the gravity applied to the particles.
   *
   * Set to 0 to disable gravity.
   */
  @type("float32") public gravityScale: number = 1;

  /**
   * The maximum number of particles that can be alive at once. After this is reached no more particles will be emitted until some die.
   */
  @type("int32") public maxParticles: number = 1000;

  /**
   * The type of particle to emit.
   */
  @type("int32") public particleType: ParticleType = ParticleType.SQUARE;

  /**
   * The sprite type of the particle to emit.
   *
   * This is only used if the particle type is set to `ParticleType.SPRITE`.
   */
  @type("number") public particleSpriteType: number = -1;

  /**
   * The lifetime of each particle in milliseconds.
   *
   * After this time the particle will be removed from the system.
   */
  @type("int32") public particleLifetimeMs: number = 1000;

  /**
   * This is the number of particles that will be emitted per second.
   */
  @type("int16") public particleEmitRatePerSecond: number = 10;

  /**
   * The initial rotation of an emitted particle in radians.
   */
  @type("float32") public particleStartRotation: number = 0;

  /**
   * The variance in the initial rotation of an emitted particle in radians. This will be used to randomly vary the rotation of the particle.
   *
   * This is the maximum rotation that can be added or subtracted from the initial rotation.
   */
  @type("float32") public particleStartRotationVariance: number = 0;

  /**
   * The initial speed of an emitted particle.
   */
  @type("float32") public particleStartSpeed: number = 0.1;

  /**
   * The variance in the initial speed of an emitted particle. This will be used to randomly vary the speed of the particle.
   *
   * This is the maximum speed that can be added or subtracted from the initial speed.
   */
  @type("float32") public particleStartSpeedVariance: number = 0;

  /**
   * The initial direction of an emitted particle in radians.
   */
  @type("float32") public particleStartDirAngle: number = 0;

  /**
   * The variance in the initial direction of an emitted particle in radians. This will be used to randomly vary the direction of the particle.
   *
   * This is the maximum direction that can be added or subtracted from the initial direction.
   */
  @type("float32") public particleStartDirVariance: number = 0;

  /**
   * The initial size of an emitted particle.
   */
  @type("float32") public particleStartSize: number = 0.1;

  /**
   * The variance in the initial size of an emitted particle. This will be used to randomly vary the size of the particle.
   *
   * This is the maximum size that can be added or subtracted from the initial size.
   */
  @type("float32") public particleStartSizeVariance: number = 0;

  /**
   * This is the rate at which the particle will rotate in radians per second.
   */
  @type("float32") public particleRotateRate: number = 0;

  /**
   * The variance in the rotation rate of an emitted particle in radians per second. This will be used to randomly vary the rotation rate of the particle.
   *
   * This is the maximum rotation rate that can be added or subtracted from the initial rotation rate. This will be chosen per particle when emitted and remain constant for the lifetime of the particle.
   */
  @type("float32") public particleRotateRateVariance: number = 0;

  /**
   * This is the rate at which the particle will accelerate in meters per second squared.
   */
  @type("float32") public particleAccelerationRate: number = 0;

  /**
   * The variance in the acceleration rate of an emitted particle in meters per second squared. This will be used to randomly vary the acceleration rate of the particle.
   *
   * This is the maximum acceleration rate that can be added or subtracted from the initial acceleration rate. This will be chosen per particle when emitted and remain constant for the lifetime of the particle.
   */
  @type("float32") public particleAccelerationRateVariance: number = 0;

  /**
   * This is the rate at which the particle will scale.
   *
   * If `particleEnableExponentialScaleRate` is false, the particle will scale by the scale rate each second. i.e. additive
   *
   * If `particleEnableExponentialScaleRate` is true, the particle will scale by a factor of the scale rate each second. i.e. multiplicative
   */
  @type("float32") public particleScaleRate: number = 0;

  /**
   * If this is true, the particle scale rate will be exponential. i.e. the particle will scale by a factor of the scale rate each second.
   */
  @type("boolean") public particleEnableExponentialScaleRate: boolean = false;

  /**
   * The variance in the scale rate of an emitted particle in meters per second. This will be used to randomly vary the scale rate of the particle.
   *
   * This is the maximum scale rate that can be added or subtracted from the initial scale rate. This will be chosen per particle when emitted and remain constant for the lifetime of the particle.
   */
  @type("float32") public particleScaleRateVariance: number = 0;

  /**
   * The start color of the particle.
   *
   * This is a hex color value.
   */
  @type("number") public particleStartColor: number = 0xffffff;

  /**
   * The start alpha of the particle.
   *
   * This should be a value between 0 and 1 (inclusive).
   */
  @type("float32") public particleStartAlpha: number = 1;

  /**
   * The color stops for the particle.
   *
   * This is used to have fine grained control of the particle's color and alpha over its lifetime.
   */
  @type([ParticleEmitterColorStop]) public particleColorStops: ArraySchema<ParticleEmitterColorStop> =
    new ArraySchema<ParticleEmitterColorStop>();

  constructor() {
    super(ParticleEmitter.COMPONENT_ID);
  }
}
