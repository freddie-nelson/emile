import { Container, ContainerChild } from "pixi.js";
import Engine from "../../engine";
import { Vec2 } from "../../math/vec";

/**
 * Creates a simple culling function that culls entities based on their distance from the camera's center.
 *
 * @param engine The engine of the sprite creator using the culling function.
 *
 * @returns A function that returns true if the entity should be culled, false otherwise.
 */
export const createSimpleCullingFunction =
  (engine: Engine) =>
  (entity: string, container: Container<ContainerChild>): boolean => {
    const renderer = engine.renderer;
    const sceneGraph = engine.sceneGraph;
    if (!renderer || !sceneGraph) {
      return false;
    }

    const scale = renderer.getScale();
    const app = renderer.getApp();
    if (!app) {
      return false;
    }

    const viewWidth = app.canvas.width / scale;
    const viewHeight = app.canvas.height / scale;
    const transform = sceneGraph.getWorldTransform(entity);
    const center = renderer.camera.options.worldCentre;

    const sqrRadius = Math.pow(0.5 * Math.max(viewWidth, viewHeight), 2);
    const sqrDist = Vec2.sqrDistance(center, transform.position);

    return sqrDist > sqrRadius;
  };
