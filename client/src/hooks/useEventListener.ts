import { useEffect } from "react";

export function useEventListener(
  query: string | Document | Window | ScreenOrientation,
  event: string,
  handler: (event: Event) => void
) {
  useEffect(() => {
    const element = typeof query === "string" ? document.querySelector(query) : query;
    if (!element) {
      throw new Error(`Element with query "${query}" not found`);
    }

    element.addEventListener(event, handler);

    return () => {
      element.removeEventListener(event, handler);
    };
  }, []);
}
