import { useState } from "react";

import { type EditorEntity, type UseObjectList } from "./useObjectTabs";

const initial: EditorEntity[] = [
  { id: "1", name: "Player", meta: "8 components", parentId: null },
  { id: "2", name: "Camera", meta: "4 components", parentId: "1" },
  { id: "3", name: "Enemy", meta: "6 components", parentId: null },
  { id: "4", name: "Projectile", meta: "3 components", parentId: "1" },
  { id: "5", name: "Pickup", meta: "2 components", parentId: null },
  { id: "6", name: "WeaponSlot", meta: "3 components", parentId: "1" },
  { id: "7", name: "MuzzleFlash", meta: "1 component", parentId: "6" },
  { id: "8", name: "Minion", meta: "5 components", parentId: "3" },
];

let nextId = initial.length + 1;

/** Mock entity list with create/remove/update mutators. */
export function useEntities(): UseObjectList<EditorEntity> {
  const [items, setItems] = useState<EditorEntity[]>(initial);

  const create = (parentId: string | null) =>
    setItems((prev) => [
      ...prev,
      { id: String(nextId++), name: "New Entity", meta: "0 components", parentId: parentId },
    ]);

  const remove = (id: string) =>
    setItems((prev) => {
      // Collect the target and any descendants reachable through parentId.
      const toRemove = new Set<string>([id]);

      // keep looping until no new descendants are found
      // order of prev won't be in any particular order, so we need to keep checking until no new descendants are found
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of prev) {
          if (item.parentId && toRemove.has(item.parentId) && !toRemove.has(item.id)) {
            toRemove.add(item.id);
            changed = true;
          }
        }
      }

      return prev.filter((item) => !toRemove.has(item.id));
    });

  const update = (id: string, name: string) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));

  return { items, create, remove, update };
}
