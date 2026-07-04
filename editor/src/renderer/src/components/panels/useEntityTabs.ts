import { useComponents } from "./useComponents";
import { useEntities } from "./useEntities";
import { useSystems } from "./useSystems";

export interface EntityItem {
  id: string;
  name: string;
  meta: string;

  /**
   * The id of this entity's parent entity, or `null` if it is a root.
   * Mirrors the engine's `ParentTag.parentEntityId`.
   */
  parentId: string | null;
}

export interface UseEntityList {
  items: EntityItem[];
  create: (selectedId: string | null) => void;
  remove: (id: string) => void;
  update: (id: string, name: string) => void;
}

interface UseEntityTabs {
  entities: UseEntityList;
  components: UseEntityList;
  systems: UseEntityList;
}

/** Aggregates entity/component/system lists from their respective hooks. */
export function useEntityTabs(): UseEntityTabs {
  const entities = useEntities();
  const components = useComponents();
  const systems = useSystems();

  return { entities, components, systems };
}
