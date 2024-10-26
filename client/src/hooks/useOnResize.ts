import { useEffect, useState } from "react";
import { useWaitForElement } from "./useWaitForElement";

export function useOnResize<T>(querySelector: string, onResize: (width: number, height: number) => T) {
  const [value, setValue] = useState(onResize(0, 0));
  const e = useWaitForElement(() => document.querySelector(querySelector));

  useEffect(() => {
    if (!e) return;

    const resizeListener = () => {
      const rect = e.getBoundingClientRect();
      setValue(onResize(rect.width, rect.height));
    };

    const resizeObserver = new ResizeObserver(resizeListener);
    resizeObserver.observe(e);
    resizeListener();

    return () => resizeObserver.disconnect();
  }, [e]);

  return value;
}
