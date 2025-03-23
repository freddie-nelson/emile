import { ColyseusClient } from "@/api/colyseus";
import { EngineType } from "@engine/src/engine";
import { Keyboard } from "@engine/src/input/keyboard";
import { Mouse } from "@engine/src/input/mouse";
import { Renderer } from "@engine/src/rendering/renderer";
import ParticleSpriteCreator from "@engine/src/rendering/sprite-creators/particleSpriteCreator";
import PhysicsEntitySpriteCreator from "@engine/src/rendering/sprite-creators/physicsEntitySpriteCreator";
import TextSpriteCreator from "@engine/src/rendering/sprite-creators/textSpriteCreator";
import Game from "@game/src/game";
import { createClientMainScene } from "@game/src/scenes/main";
import { sharedEngineOptions } from "@shared/src/engine";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";

export default async function setupGame(
  state: State,
  player: Player,
  room: Room<State>
): Promise<{ game: Game; renderer: Renderer }> {
  Keyboard.enable();
  Mouse.enable();

  const game = new Game({
    ...sharedEngineOptions,
    type: EngineType.CLIENT,
    state: state,
    autoStart: false,
  });

  // add scenes
  // must be added before the game is started
  game.engine.scenes.add(
    createClientMainScene(game, room, player, state, () => (room ? ColyseusClient.getPing(room.id) / 2 : 0))
  );

  // start game
  game.start();

  // setup renderer
  // renderer must be created and added after the game has started
  const renderer = new Renderer({
    autoInit: false,
    autoSize: true,
    backgroundColor: 0x000000,
  });
  renderer.camera.zoom = 0.7;

  // setup sprite creators

  // uncomment this to use the sprite creator
  // add your sprites to the sprite map
  // then add SpriteTag components to your entities

  //   const spriteMap = new Map<SpriteType, SpriteImage>();
  //   spriteMap.set(SpriteType.NONE, {
  //     type: SpriteImageType.SINGLE,
  //     src: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/ef/Missing_Texture_JE3.png/revision/latest?cb=20211013103047",
  //   });

  //   renderer.registerSpriteCreator(new SpriteSpriteCreator());

  renderer.registerSpriteCreator(new PhysicsEntitySpriteCreator(0xff0000, 1));
  renderer.registerSpriteCreator(new ParticleSpriteCreator());
  renderer.registerSpriteCreator(new TextSpriteCreator());

  // add renderer
  game.registry.addSystem(renderer);

  // initalise async engine dependencies
  await renderer.init();

  return { game, renderer };
}
