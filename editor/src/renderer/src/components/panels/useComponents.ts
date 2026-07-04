import { useState } from "react";

import { type EntityItem, type UseEntityList } from "./useEntityTabs";

const initial: EntityItem[] = [
  { id: "1", name: "Transform", meta: "struct" },
  { id: "2", name: "Sprite", meta: "asset" },
  { id: "3", name: "RigidBody", meta: "physics" },
  { id: "4", name: "Collider", meta: "physics" },
  { id: "5", name: "Animator", meta: "asset" },
  { id: "6", name: "Light", meta: "render" },
];

let nextId = initial.length + 1;

/** Mock component list with create/remove/update mutators. */
export function useComponents(): UseEntityList {
  const [items, setItems] = useState<EntityItem[]>(initial);

  const create = () =>
    setItems((prev) => [
      ...prev,
      { id: String(nextId++), name: "New Component", meta: "struct" },
    ]);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const update = (id: string, name: string) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));

  return { items, create, remove, update };
}
