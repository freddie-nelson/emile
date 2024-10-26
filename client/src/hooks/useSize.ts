import useResizeObserver from "@react-hook/resize-observer";
import { RefObject, useEffect, useLayoutEffect, useState } from "react";
import { useWaitForElement } from "./useWaitForElement";

export function useSize(target: RefObject<HTMLElement>) {
  const [size, setSize] = useState<DOMRect>();

  useLayoutEffect(() => {
    if (!target.current) return;

    setSize(target.current.getBoundingClientRect());
  }, [target]);

  useResizeObserver(target, (entry) => {
    setSize(entry.contentRect);
  });

  return size;
}

export function useParentSize(target: RefObject<HTMLElement>) {
  const [size, setSize] = useState<DOMRect>();

  const e = useWaitForElement(() => target.current?.parentElement);

  useEffect(() => {
    if (!e) return;

    setSize(e.getBoundingClientRect());

    const resizeObserver = new ResizeObserver((entries) => {
      setSize(entries[0].contentRect);
    });
    resizeObserver.observe(e);

    return () => resizeObserver.disconnect();
  }, [e]);

  return size;
}
