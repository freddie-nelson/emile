import { useEffect, useState } from "react";

export function useWaitForElement(el: () => Element | null | undefined) {
  const [e, setE] = useState<Element | null>(el() ?? null);

  useEffect(() => {
    const newE = el();
    setE(newE ?? null);

    if (newE) return;

    const mutationObserver = new MutationObserver(() => {
      const newE = el();

      if (newE) {
        setE(newE);
        mutationObserver.disconnect();
      }
    });

    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => mutationObserver.disconnect();
  });

  return e;
}
