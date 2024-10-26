import { useState } from "react";
import { useEventListener } from "./useEventListener";

export function useOrientation() {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait"
  );

  useEventListener(window, "orientationchange", () => {
    requestAnimationFrame(() => {
      setOrientation(window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait");
    });
  });

  return orientation;
}
