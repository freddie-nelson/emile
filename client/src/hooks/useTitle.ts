import { env } from "@/helpers/env";
import { useEffect } from "react";

export function useTitle(title = env.TITLE, prefix = env.TITLE_PREFIX) {
  useEffect(() => {
    document.title = `${prefix}${title}`;
  }, []);
}
