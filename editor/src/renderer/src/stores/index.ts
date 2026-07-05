import {
  EditorComponent,
  EditorEntity,
  EditorSystem,
} from "@renderer/components/panels/useObjectTabs";
import { create } from "zustand";

const mockEntities: EditorEntity[] = [
  { id: "1", name: "Player", meta: "8 components", parentId: null },
  { id: "2", name: "Camera", meta: "4 components", parentId: "1" },
  { id: "3", name: "Enemy", meta: "6 components", parentId: null },
  { id: "4", name: "Projectile", meta: "3 components", parentId: "1" },
  { id: "5", name: "Pickup", meta: "2 components", parentId: null },
  { id: "6", name: "WeaponSlot", meta: "3 components", parentId: "1" },
  { id: "7", name: "MuzzleFlash", meta: "1 component", parentId: "6" },
  { id: "8", name: "Minion", meta: "5 components", parentId: "3" },
];

const mockSystems: EditorSystem[] = [
  { id: "1", name: "MovementSystem", meta: "update" },
  { id: "2", name: "PhysicsSystem", meta: "fixed" },
  { id: "3", name: "RenderSystem", meta: "render" },
  { id: "4", name: "AnimationSystem", meta: "update" },
];

const mockComponents: EditorComponent[] = [
  { id: "1", name: "Transform", meta: "struct" },
  { id: "2", name: "Sprite", meta: "asset" },
  { id: "3", name: "RigidBody", meta: "physics" },
  { id: "4", name: "Collider", meta: "physics" },
  { id: "5", name: "Animator", meta: "asset" },
  { id: "6", name: "Light", meta: "render" },
];

interface Store {
  entities: EditorEntity[];
  addEntity: (parentId: string | null) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, name: string) => void;

  components: EditorComponent[];
  addComponent: () => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, name: string) => void;

  systems: EditorSystem[];
  addSystem: () => void;
  removeSystem: (id: string) => void;
  updateSystem: (id: string, name: string) => void;
}

export const useStore = create<Store>((set, get) => ({
  entities: mockEntities,
  addEntity: (parentId: string | null) => {
    set((prev) => ({
      entities: [
        ...prev.entities,
        {
          id: String(Math.floor(Math.random() * 9999)),
          name: "New Entity",
          meta: "0 components",
          parentId: parentId,
        },
      ],
    }));
  },
  removeEntity: (id: string) => {
    set((prev) => ({
      entities: prev.entities.filter((item) => item.id !== id),
    }));
  },
  updateEntity: (id: string, name: string) => {
    set((prev) => ({
      entities: prev.entities.map((item) => (item.id === id ? { ...item, name } : item)),
    }));
  },

  components: mockComponents,
  addComponent: () => {
    set((prev) => ({
      components: [
        ...prev.components,
        {
          id: String(Math.floor(Math.random() * 9999)),
          name: "New Component",
          meta: "struct",
        },
      ],
    }));
  },
  removeComponent: (id: string) => {
    set((prev) => ({
      components: prev.components.filter((item) => item.id !== id),
    }));
  },
  updateComponent: (id: string, name: string) => {
    set((prev) => ({
      components: prev.components.map((item) => (item.id === id ? { ...item, name } : item)),
    }));
  },

  systems: mockSystems,
  addSystem: () => {
    set((prev) => ({
      systems: [
        ...prev.systems,
        { id: String(Math.floor(Math.random() * 9999)), name: "New System", meta: "update" },
      ],
    }));
  },
  removeSystem: (id: string) => {
    set((prev) => ({
      systems: prev.systems.filter((item) => item.id !== id),
    }));
  },
  updateSystem: (id: string, name: string) => {
    set((prev) => ({
      systems: prev.systems.map((item) => (item.id === id ? { ...item, name } : item)),
    }));
  },
}));
