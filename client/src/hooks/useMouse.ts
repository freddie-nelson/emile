import { useState } from "react";

export function useMouse(e = document.documentElement) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  e.addEventListener("mousemove", (event) => {
    setMouse({ x: event.clientX, y: event.clientY });
  });

  return mouse;
}
