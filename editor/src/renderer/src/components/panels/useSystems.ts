import { useState } from "react";

import { type EditorSystem, type UseObjectList } from "./useObjectTabs";

const initial: EditorSystem[] = [
  { id: "1", name: "MovementSystem", meta: "update" },
  { id: "2", name: "PhysicsSystem", meta: "fixed" },
  { id: "3", name: "RenderSystem", meta: "render" },
  { id: "4", name: "AnimationSystem", meta: "update" },
];

let nextId = initial.length + 1;

/** Mock system list with create/remove/update mutators. */
export function useSystems(): UseObjectList<EditorSystem> {
  const [items, setItems] = useState<EditorSystem[]>(initial);

  const create = () =>
    setItems((prev) => [
      ...prev,
      { id: String(nextId++), name: "New System", meta: "update" },
    ]);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const update = (id: string, name: string) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));

  return { items, create, remove, update };
}
