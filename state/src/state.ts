import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Entity } from "@engine/src/ecs/entity";
import { EntityMap } from "@engine/src/ecs/registry";
import RoomInfo from "./RoomInfo";
import Player from "./Player";

export class State extends Schema {
  @type(RoomInfo) public roomInfo: RoomInfo = new RoomInfo();
  @type([Player]) public players: ArraySchema<Player> = new ArraySchema<Player>();

  @type({ map: Entity }) public entities: EntityMap = new MapSchema<Entity>();
}
