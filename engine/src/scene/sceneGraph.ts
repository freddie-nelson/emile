import { Transform } from "../core/transform";
import { System, SystemType, SystemUpdateData } from "../ecs/system";
import { ParentTag } from "./parentTag";
import Engine from "../engine";
import { Vec2 } from "../math/vec";

export interface WorldTransform {
  position: Vec2;
  rotation: number;
  scale: Vec2;
  zIndex: number;
}

export default class SceneGraph extends System {
  private readonly parents: Map<string, string> = new Map();
  private readonly children: Map<string, Set<string>> = new Map();
  private readonly transforms: Map<string, WorldTransform> = new Map();
  private readonly engine: Engine;

  constructor(engine: Engine) {
    super(SystemType.SERVER_AND_CLIENT, new Set([Transform, ParentTag]), 1000);

    this.engine = engine;
  }

  public update = ({ engine, registry, entities, dt }: SystemUpdateData) => {
    // update relationships
    for (const entity of entities) {
      const parentTag = registry.get(entity, ParentTag);

      if (!parentTag.parentEntityId || !registry.has(parentTag.parentEntityId)) {
        registry.remove(entity, ParentTag);
        this.unrelate(entity);
        continue;
      }

      if (this.getParent(entity) !== parentTag.parentEntityId) {
        this.relate(parentTag.parentEntityId, entity);
      }
    }

    // remove relationships for entities that no longer exist
    for (const entity of this.parents.keys()) {
      if (!registry.has(entity)) {
        this.unrelate(entity);
      }
    }

    // clear the transform cache
    this.transforms.clear();
  };

  public getWorldTransform(entity: string, forceUpdate = false): WorldTransform {
    if (!forceUpdate && this.transforms.has(entity)) {
      return this.transforms.get(entity)!;
    }

    const transform = this.engine.registry.get(entity, Transform);
    const parent = this.getParent(entity);
    if (!parent) {
      return transform;
    }

    const parentTransform = this.getWorldTransform(parent, forceUpdate);

    const worldTransform = {
      position: new Vec2(
        parentTransform.position.x + transform.position.x,
        parentTransform.position.y + transform.position.y
      ),
      rotation: parentTransform.rotation + transform.rotation,
      scale: new Vec2(
        parentTransform.scale.x * transform.scale.x,
        parentTransform.scale.y * transform.scale.y
      ),
      zIndex: transform.zIndex, // we always use the child's zIndex
    };

    this.transforms.set(entity, worldTransform);

    return worldTransform;
  }

  public toLocalTransform(e: string, worldTransform: WorldTransform) {
    const parent = this.getParent(e);
    if (!parent) {
      return worldTransform;
    }

    const parentTransform = this.getWorldTransform(parent);

    return {
      position: new Vec2(
        worldTransform.position.x - parentTransform.position.x,
        worldTransform.position.y - parentTransform.position.y
      ),
      rotation: worldTransform.rotation - parentTransform.rotation,
      scale: new Vec2(
        worldTransform.scale.x / parentTransform.scale.x,
        worldTransform.scale.y / parentTransform.scale.y
      ),
      zIndex: worldTransform.zIndex,
    };
  }

  /**
   * Gets the parent of an entity, if it has one.
   *
   * @param entity The entity to get the parent of.
   *
   * @returns The entity's parent, or `null` if the entity has no parent.
   */
  public getParent(entity: string): string | null {
    return this.parents.get(entity) ?? null;
  }

  /**
   * Gets the children of an entity, if it has any.
   *
   * @note DO NOT MODIFY THE RETURNED SET
   *
   * @param entity The entity to get the children of.
   *
   * @returns The entity's children, or `null` if the entity has no children.
   */
  public getChildren(entity: string): Set<string> | null {
    return this.children.get(entity) ?? null;
  }

  private relate(parent: string, child: string): void {
    if (!this.children.has(parent)) {
      this.children.set(parent, new Set());
    }

    if (this.parents.has(child)) {
      const oldParent = this.parents.get(child)!;
      this.children.get(oldParent)!.delete(child);
      this.parents.delete(child);
    }

    this.children.get(parent)!.add(child);
    this.parents.set(child, parent);
  }

  private unrelate(child: string): void {
    if (!this.parents.has(child)) {
      return;
    }

    const parent = this.parents.get(child)!;
    this.children.get(parent)!.delete(child);
    this.parents.delete(child);
  }
}
