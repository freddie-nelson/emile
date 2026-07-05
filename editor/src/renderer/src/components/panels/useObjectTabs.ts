import { useComponents } from "./useComponents";
import { useEntities } from "./useEntities";
import { useSystems } from "./useSystems";

export interface EditorEntity {
  id: string;
  name: string;
  meta: string;

  /**
   * The id of this entity's parent entity, or `null` if it is a root.
   * Mirrors the engine's `ParentTag.parentEntityId`.
   */
  parentId: string | null;
}

export interface EditorComponent {
  id: string;
  name: string;
  meta: string;
}

export interface EditorSystem {
  id: string;
  name: string;
  meta: string;
}

/** Union of all editor list-item types — the shared type for list UI rendering. */
export type EditorItem = EditorEntity | EditorComponent | EditorSystem;

export interface UseObjectList<T extends EditorItem = EditorItem> {
  items: T[];
  create: (selectedId: string | null) => void;
  remove: (id: string) => void;
  update: (id: string, name: string) => void;
  move?: (id: string, newParentId: string | null) => void;
}

interface UseObjectTabs {
  entities: UseObjectList<EditorEntity>;
  components: UseObjectList<EditorComponent>;
  systems: UseObjectList<EditorSystem>;
}

/** Aggregates entity/component/system lists from their respective hooks. */
export function useObjectTabs(): UseObjectTabs {
  const entities = useEntities();
  const components = useComponents();
  const systems = useSystems();

  return { entities, components, systems };
}
