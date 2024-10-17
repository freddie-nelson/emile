import { Schema } from "@colyseus/schema";

export class Component extends Schema {}

export type ComponentConstructor = new () => Component;
