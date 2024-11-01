import { env } from "@/helpers/env";
import { useEffect, useRef } from "react";
import { useBeforeUnload } from "react-router-dom";

export function useBeforeRouteLeave(cb: () => void) {
  const runCount = useRef(0);

  useEffect(() => {
    // skip first run in development
    // this is for strict mode
    if (env.NODE_ENV === "development") {
      runCount.current += 1;
      if (runCount.current === 1) {
        return;
      }
    }

    return cb;
  }, []);

  useBeforeUnload(cb);
}
