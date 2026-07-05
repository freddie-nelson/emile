import { useShallow } from "zustand/react/shallow";
import { useStore } from "@renderer/stores";
import { type EditorSystem, type UseObjectList } from "./useObjectTabs";

export function useSystems(): UseObjectList<EditorSystem> {
  return useStore(
    useShallow((state) => ({
      items: state.systems,
      create: state.addSystem,
      remove: state.removeSystem,
      update: state.updateSystem,
    })),
  );
}
