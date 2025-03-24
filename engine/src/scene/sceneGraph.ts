import { mat4, quat } from "gl-matrix";
import { Transform } from "../core/transform";
import { System, SystemType, SystemUpdateData } from "../ecs/system";
import { ParentTag } from "./parentTag";
import Engine from "../engine";
import { Vec2 } from "../math/vec";
import { radiansToDegrees } from "../math/angle";
import { decomposeMat2d } from "../math/mat2d";

export interface WorldTransform {
  position: Vec2;
  rotation: number;
  scale: Vec2;
  zIndex: number;
}

/**
 * Creates a new world transform.
 *
 * @param position The position of the transform.
 * @param rotation The rotation of the transform.
 * @param scale The scale of the transform.
 * @param zIndex The z-index of the transform.
 * @param flipYScale Whether to flip the y scale.
 *
 * @returns The created world transform.
 */
export function createWorldTransform(
  position: { x: number; y: number },
  rotation: number,
  scale: { x: number; y: number },
  zIndex = 0,
  flipYScale = false
): WorldTransform {
  return {
    position: new Vec2(position.x, position.y),
    rotation: rotation,
    scale: new Vec2(scale.x, flipYScale ? -scale.y : scale.y),
    zIndex,
  };
}

export default class SceneGraph extends System {
  private readonly parents: Map<string, string> = new Map();
  private readonly children: Map<string, Set<string>> = new Map();
  private readonly matrices: Map<string, mat4> = new Map();
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
    this.matrices.clear();
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

    const worldMatrix = this.getWorldMatrix(entity, forceUpdate);
    const worldTransform = this.matrixToTransform(worldMatrix);
    this.transforms.set(entity, worldTransform);

    // always use entity's z-index
    worldTransform.zIndex = transform.zIndex;

    return worldTransform;
  }

  public toLocalTransform(e: string, worldTransform: WorldTransform) {
    const parent = this.getParent(e);
    if (!parent) {
      return worldTransform;
    }

    const parentMatrix = this.getWorldMatrix(parent);
    const invParentMatrix = mat4.create();
    mat4.invert(invParentMatrix, parentMatrix);

    const entityMatrix = this.getWorldMatrix(e);
    const localMatrix = mat4.create();
    mat4.multiply(localMatrix, invParentMatrix, entityMatrix);

    return this.matrixToTransform(localMatrix);
  }

  /**
   * Gets the world matrix of the given entity.
   *
   * @param entity The entity to get the world matrix of.
   * @param forceUpdate Whether to force an update of the matrix, or use the cached value if it exists.
   *
   * @returns The world matrix of the entity.
   */
  public getWorldMatrix(entity: string, forceUpdate = false): mat4 {
    if (!forceUpdate && this.matrices.has(entity)) {
      return this.matrices.get(entity)!;
    }

    const transform = this.engine.registry.get(entity, Transform);
    const mat = this.transformToMatrix(transform);

    const parent = this.getParent(entity);
    if (!parent) {
      return mat;
    }

    const parentMatrix = this.getWorldMatrix(parent, forceUpdate);
    mat4.multiply(mat, parentMatrix, mat);

    this.matrices.set(entity, mat);

    return mat;
  }

  /**
   * Converts the given transform to a matrix.
   *
   * @param transform The transform to convert to a matrix.
   *
   * @returns The matrix represented by the transform.
   */
  public transformToMatrix(transform: Transform | WorldTransform): mat4 {
    return mat4.fromRotationTranslationScale(
      mat4.create(),
      quat.fromEuler(quat.create(), 0, 0, radiansToDegrees(transform.rotation)),
      [transform.position.x, transform.position.y, 0],
      [transform.scale.x, transform.scale.y, 1]
    );
  }

  /**
   * Converts the given matrix to a transform.
   *
   * @see {@link decomposeMat2d}
   *
   * @param matrix The matrix to convert to a transform.
   *
   * @returns The transform represented by the matrix.
   */
  public matrixToTransform(matrix: mat4): WorldTransform {
    return decomposeMat2d(matrix);
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
