import {
	Color,
	ColorSource,
	ContainerChild,
	Graphics,
	Assets,
	Sprite,
	Texture,
	Container,
	TilingSprite,
	AnimatedSprite,
} from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Rigidbody } from "../../physics/rigidbody";
import { CircleCollider, ColliderType, PolygonCollider, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity } from "../../ecs/entity";
import { ColorTag } from "../colorTag";
import { Vec2 } from "../../math/vec";
import { lerp } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { SpriteTag } from "../spriteTag";

export enum SpriteImageType {
	SINGLE,
	TILE,
	ANIMATED,
}

export interface SingleSpriteImage {
	type: SpriteImageType.SINGLE | SpriteImageType.TILE;
	src: string;
	tileWidth?: number;
	tileHeight?: number;
	pixelated?: boolean;
}

export interface AnimatedSpriteImage {
	type: SpriteImageType.ANIMATED;
	src: string[];
	pixelated?: boolean;
	animationSpeed?: number;
	loop?: boolean;
	autoUpdate?: boolean;
}

export type SpriteImage = SingleSpriteImage | AnimatedSpriteImage;

/**
 * Creates sprites based on entities with the SpriteTag component.
 *
 * @note YOU MUST CALL `preloadTextures` BEFORE USING THE SPRITE CREATOR
 */
export default class SpriteSpriteCreator implements SpriteCreator {
	public readonly query = new Set([Transform, SpriteTag]);

	private readonly spriteImageMap: Map<number, SpriteImage>;
	private readonly textureCache: Map<string, Texture>;
	private readonly createdSpriteTypeMap: Map<string, number>;

	constructor(spriteImageMap: Map<number, SpriteImage> = new Map()) {
		this.spriteImageMap = spriteImageMap;
		this.textureCache = new Map();
		this.createdSpriteTypeMap = new Map();
	}

	public readonly create: SpriteCreatorCreate = ({ app, registry, world, entity }) => {
		const e = registry.get(entity);

		const transform = Entity.getComponent(e, Transform);
		const spriteTag = Entity.getComponent(e, SpriteTag);

		const collider = PhysicsWorld.getCollider(e);

		if (!this.spriteImageMap.has(spriteTag.spriteType)) {
			Logger.errorAndThrow(
				"RENDERER",
				`Sprite image map does not contain an image for type '${spriteTag.spriteType}'.`
			);
		}

		let width = 0;
		let height = 0;

		if (!collider) {
			width = spriteTag.overrideWidth;
			height = spriteTag.overrideHeight;
		} else {
			switch (collider.type) {
				case ColliderType.CIRCLE: {
					const circle = collider as CircleCollider;
					width = circle.radius * 2;
					height = circle.radius * 2;
					break;
				}
				case ColliderType.RECTANGLE: {
					const rect = collider as RectangleCollider;
					width = rect.width;
					height = rect.height;
					break;
				}
				case ColliderType.POLYGON:
					// ! TODO: Implement this at some point <3
					Logger.errorAndThrow("RENDERER", "Polygon colliders are not supported in sprite sprite creator.");
					break;
				default:
					Logger.errorAndThrow(
						"RENDERER",
						`Unsupported collider type in sprite sprite creator: ${collider.type}`
					);
					break;
			}
		}

		width = spriteTag.overrideWidth || width;
		height = spriteTag.overrideHeight || height;

		const container = new Container();
		container.pivot.set(width / 2, height / 2);

		const image = this.spriteImageMap.get(spriteTag.spriteType)!;

		let s: ContainerChild;
		switch (image.type) {
			case SpriteImageType.SINGLE:
				s = new Sprite({
					texture: this.getTexture(image.src),
					width,
					height,
				});
				break;
			case SpriteImageType.TILE:
				if (typeof image.tileWidth !== "number" || typeof image.tileHeight !== "number") {
					Logger.errorAndThrow("RENDERER", "Tile image must have tileWidth and tileHeight defined.");

					// this will never happen
					return container;
				}

				s = new TilingSprite({
					texture: this.getTexture(image.src),
					width,
					height,
				});
				(s as TilingSprite).tileScale.set(1 / image.tileWidth!, 1 / image.tileHeight!);
				break;
			case SpriteImageType.ANIMATED:
				s = new AnimatedSprite({
					textures: this.getTextureArray(image.src),
					width,
					height,
					autoUpdate: image.autoUpdate ?? true,
				});
				(s as AnimatedSprite).loop = image.loop ?? true;
				(s as AnimatedSprite).animationSpeed = image.animationSpeed ?? 1;
				(s as AnimatedSprite).play();
				break;
			// default:
			// 	Logger.errorAndThrow("RENDERER", `Unsupported sprite image type: ${image.type}`);

			// 	// will never happen
			// 	return container;
		}

		container.addChild(s);
		world.addChild(container);

		container.position.set(transform.position.x, transform.position.y);
		container.rotation = transform.rotation;
		container.scale.set(transform.scale.x, -transform.scale.y);
		container.zIndex = transform.zIndex;
		container.alpha = spriteTag.opacity;

		this.createdSpriteTypeMap.set(entity, spriteTag.spriteType);

		return container;
	};

	public readonly update: SpriteCreatorUpdate = (data) => {
		const { registry, app, entity, sprite, dt } = data;

		const e = registry.get(entity);
		const s = sprite!;

		const transform = Entity.getComponent(e, Transform);
		const spriteTag = Entity.getComponent(e, SpriteTag);

		if (spriteTag.spriteType !== this.createdSpriteTypeMap.get(entity)) {
			return this.create(data);
		}

		const position = Vec2.lerp(new Vec2(s.position.x, s.position.y), transform.position, CLIENT_LERP_RATE);
		s.position.set(position.x, position.y);

		s.rotation = lerp(s.rotation, transform.rotation, CLIENT_LERP_RATE);
		s.scale.set(transform.scale.x, -transform.scale.y);
		s.zIndex = transform.zIndex;
		s.alpha = spriteTag.opacity;
	};

	public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }) => {
		sprite!.removeFromParent();
		sprite!.destroy();
	};

	/**
	 * Preload textures into the sprite creator.
	 *
	 * @note YOU MUST CALL THIS BEFORE USING THE SPRITE CREATOR
	 */
	public async preloadTextures() {
		for (const image of this.spriteImageMap.values()) {
			const sources = image.type === SpriteImageType.ANIMATED ? (image as AnimatedSpriteImage).src : [image.src];
			for (const src of sources) {
				const res = await Assets.load(src);
				if (image.pixelated) {
					res.source.scaleMode = "nearest";
				}

				this.textureCache.set(src, res);
			}
		}
	}

	private getTexture(image: string) {
		return this.textureCache.get(image);
	}

	private getTextureArray(image: string[]) {
		return image.map((i) => this.textureCache.get(i)!);
	}
}
