import { MapSchema, Schema, type } from "@colyseus/schema";
import { Entity } from "@ecs/src/entity";
import { EntityMap } from "@ecs/src/registry";

export class State extends Schema {
  @type({ map: Entity }) public entities: EntityMap = new MapSchema<Entity>();
}
