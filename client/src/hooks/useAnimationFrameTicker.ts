import { useEffect, useRef } from "react";

export default function useAnimationFrameTicker(cb: () => void) {
  const id = useRef(0);

  useEffect(() => {
    const savedId = id.current;

    const animate = () => {
      if (savedId !== id.current) return;

      cb();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    return () => {
      id.current = savedId + 1;
    };
  });
}
