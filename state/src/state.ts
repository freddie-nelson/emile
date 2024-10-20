import { MapSchema, Schema, type } from "@colyseus/schema";
import { Entity } from "@engine/src/ecs/entity";
import { EntityMap } from "@engine/src/ecs/registry";

export class State extends Schema {
  @type({ map: Entity }) public entities: EntityMap = new MapSchema<Entity>();
}
