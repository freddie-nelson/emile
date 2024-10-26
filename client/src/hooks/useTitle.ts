import { useEffect } from "react";

export function useTitle(title: string, prefix = "Emile Demo | ") {
  useEffect(() => {
    document.title = `${prefix}${title}`;
  }, []);
}
