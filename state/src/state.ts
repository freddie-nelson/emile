import { MapSchema, Schema, type } from "@colyseus/schema";
import { Entity } from "@engine/src/ecs/entity";
import { EntityMap } from "@engine/src/ecs/registry";
import RoomInfo from "./RoomInfo";
import Player from "./Player";

/**
 * This is the schema representing your game's state.
 *
 * It should contain all the data that you want to sync between the server and the client.
 *
 * The properties `roomInfo`, `players`, and `entities` should never be removed, unless you **really** know what you're doing.
 *
 * Additionally the `State` class should not be renamed and should always have a parameterless constructor.
 */
export class State extends Schema {
  @type(RoomInfo) public roomInfo: RoomInfo = new RoomInfo();
  @type({ map: Player }) public players: MapSchema<Player> = new MapSchema<Player>();

  @type({ map: Entity }) public entities: EntityMap = new MapSchema<Entity>();
}
