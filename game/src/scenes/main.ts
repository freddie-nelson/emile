import SceneManager, { Scene } from "@engine/src/scene/sceneManager";
import Player from "@state/src/Player";
import Game from "../game";
import { Transform } from "@engine/src/core/transform";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Renderable } from "@engine/src/rendering/renderable";
import { ColorTag } from "@engine/src/rendering/colorTag";
import { ParentTag } from "@engine/src/scene/parentTag";
import { ParticleEmitter, ParticleEmitterColorStop } from "@engine/src/rendering/particles/emitter";
import { PlayerSystem } from "../systems/playerSystem";
import { State } from "@state/src/state";
import { SceneType } from "./scenes";
import World from "@engine/src/scene/world";

export function createServerMainScene(game: Game, players: State["players"]): Scene {
  const world = SceneManager.createBlankWorld(game.engine);
  const registry = world.registry;

  for (const p of players.values()) {
    const playerEntity = registry.create();
    registry.add(playerEntity, new Transform(new Vec2((Math.random() - 0.5) * 2)));
    registry.add(playerEntity, new Rigidbody());
    registry.add(playerEntity, new RectangleCollider(1.5, 1.5));
    registry.add(playerEntity, new Renderable());
    registry.add(playerEntity, new ColorTag(0xffffff));

    const rigidbody = registry.get(playerEntity, Rigidbody);
    rigidbody.frictionAir = 0.05;
    rigidbody.friction = 0.05;

    const emitterEntity = registry.create();
    registry.add(emitterEntity, new Transform());
    registry.add(emitterEntity, new Renderable());
    registry.add(emitterEntity, new ParentTag(playerEntity));

    const emitter = registry.add(emitterEntity, new ParticleEmitter());
    emitter.particleRotateSpeed = Math.PI * 2;
    emitter.particleStartColor = 0xf018af;
    emitter.particleColorStops.push(new ParticleEmitterColorStop(1, 0xffffff, 0.2));
    emitter.particleLifetimeMs = 2000;
    emitter.particleEmitRatePerSecond = 30;
    emitter.particleStartSize = 0.3;
    emitter.particleStartSizeVariance = 0.1;
    emitter.particleEndSize = 0;
    emitter.particleStartSizeInterpolationT = 0.7;

    p.entity = playerEntity;
  }

  return SceneManager.createScene(SceneType.MAIN, world, (world: World, state: State) => {
    world.registry.addSystem(new PlayerSystem(state.players));
  });
}
