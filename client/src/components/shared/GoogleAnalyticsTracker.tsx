import { env } from "@/helpers/env";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag("config", env.GA_TRACKING_ID, {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return null;
}
