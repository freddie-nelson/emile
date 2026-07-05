import { useShallow } from "zustand/react/shallow";
import { type EditorComponent, type UseObjectList } from "./useObjectTabs";
import { useStore } from "@renderer/stores";

export function useComponents(): UseObjectList<EditorComponent> {
  return useStore(
    useShallow((state) => ({
      items: state.components,
      create: state.addComponent,
      remove: state.removeComponent,
      update: state.updateComponent,
    })),
  );
}
