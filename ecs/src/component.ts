import { Schema } from "@colyseus/schema";

export class Component extends Schema {}

export type ComponentConstructor = new (...args: any[]) => Component;

export type Constructor<T> = new (...args: any[]) => T;
