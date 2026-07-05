import { useShallow } from "zustand/react/shallow";
import { type EditorEntity, type UseObjectList } from "./useObjectTabs";
import { useStore } from "@renderer/stores";

export function useEntities(): UseObjectList<EditorEntity> {
  return useStore(
    useShallow((state) => ({
      items: state.entities,
      create: state.addEntity,
      remove: state.removeEntity,
      update: state.updateEntity,
    })),
  );
}
