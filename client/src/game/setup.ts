import { ColyseusClient } from "@/api/colyseus";
import { useSettingsStore } from "@/stores/settings";
import { AudioAsset, AudioManager } from "@engine/src/audio/AudioManager";
import { EngineType, UpdateCallbackType } from "@engine/src/engine";
import { Keyboard } from "@engine/src/input/keyboard";
import { Mouse } from "@engine/src/input/mouse";
import { Vec2 } from "@engine/src/math/vec";
import { Renderer } from "@engine/src/rendering/renderer";
import ParticleSpriteCreator from "@engine/src/rendering/sprite-creators/particleSpriteCreator";
import PhysicsEntitySpriteCreator from "@engine/src/rendering/sprite-creators/physicsEntitySpriteCreator";
import { createSimpleCullingFunction } from "@engine/src/rendering/sprite-creators/simpleCullingFunction";
import SpriteSpriteCreator from "@engine/src/rendering/sprite-creators/spriteSpriteCreator";
import TextSpriteCreator from "@engine/src/rendering/sprite-creators/textSpriteCreator";
import Game from "@game/src/game";
import { createClientMainScene } from "@game/src/scenes/main";
import { AudioType } from "@shared/src/audioType";
import { sharedEngineOptions } from "@shared/src/engine";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";

export default async function setupGame(
  state: State,
  player: Player,
  room: Room<State>,
): Promise<{ game: Game; renderer: Renderer }> {
  // setup audio manager
  const audioAssets = new Map<string, AudioAsset>();
  // audioAssets.set(AudioType.NONE, {
  //   src: "/audio/none.mp3",
  // });

  const audioManager = new AudioManager(
    audioAssets,
    () => renderer?.camera.options.worldCentre ?? new Vec2(0),
    20,
    useSettingsStore.getState().soundVolume / 100,
  );
  await audioManager.preloadAudio();

  const game = new Game({
    ...sharedEngineOptions,
    type: EngineType.CLIENT,
    state: state,
    autoStart: false,
    audioManager,
  });

  // add scenes
  // must be added before the game is started
  game.engine.scenes.add(
    createClientMainScene(game, room, player, state, () => (room ? ColyseusClient.getPing(room.id) / 2 : 0)),
  );

  const unsubscribeSettingsStore = useSettingsStore.subscribe((state) => {
    audioManager.setGlobalVolume(state.soundVolume / 100);
  });
  game.engine.on(UpdateCallbackType.POST_DISPOSE, unsubscribeSettingsStore);

  // setup renderer
  // renderer must be created and added after the game has started
  const renderer = new Renderer({
    autoInit: false,
    autoSize: true,
    backgroundColor: 0x000000,
  });
  renderer.camera.zoom = 1;
  renderer.camera.options.smoothing = 0.7;

  // setup sprite creators

  // uncomment this to use the sprite creator
  // add your sprites to the sprite map
  // then add SpriteTag components to your entities

  //   const spriteMap = new Map<SpriteType, SpriteImage>();
  //   spriteMap.set(SpriteType.NONE, {
  //     type: SpriteImageType.SINGLE,
  //     src: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/ef/Missing_Texture_JE3.png/revision/latest?cb=20211013103047",
  //   });

  // const spriteCreator = new SpriteSpriteCreator(spriteMap);
  // await spriteCreator.preloadTextures();

  //   renderer.registerSpriteCreator(spriteCreator);

  // uncomment this to use the cursor sprite creator
  // const cursorSpriteCreator = new CursorSpriteCreator({
  //   src: "https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/ef/Missing_Texture_JE3.png/revision/latest?cb=20211013103047"
  // });
  // await cursorSpriteCreator.preloadTexture();

  // renderer.registerSpriteCreator(cursorSpriteCreator);

  renderer.registerSpriteCreator(new PhysicsEntitySpriteCreator(0xff0000, 1));
  renderer.registerSpriteCreator(
    new ParticleSpriteCreator(undefined, createSimpleCullingFunction(game.engine)),
  );
  renderer.registerSpriteCreator(new TextSpriteCreator());

  // make camera follow player entity
  // renderer.getCameraTarget = () => {
  //   if (!player.entity) {
  //     return new Vec2(0);
  //   }

  //   return game.engine.sceneGraph.getWorldTransform(player.entity).position;
  // };

  game.start();

  // add renderer
  game.registry.addSystem(renderer);

  // initalise async engine dependencies
  await renderer.init();

  Keyboard.enable();
  Mouse.enable(renderer);

  return { game, renderer };
}
