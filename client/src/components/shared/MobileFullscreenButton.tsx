import { useEventListener } from "@/hooks/useEventListener";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEffect, useState } from "react";
import { Button } from "./Button";

function MobileFullscreenButton() {
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) {
      document.documentElement.classList.add("mobile");
    } else {
      document.documentElement.classList.remove("mobile");
    }
  }, [isMobile]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEventListener(document, "fullscreenchange", () => {
    setIsFullscreen(document.fullscreenElement !== null);
  });

  if (isFullscreen || !isMobile) {
    return null;
  }

  const goFullscreen = () => {
    try {
      document.documentElement.requestFullscreen();
    } catch (error) {
      console.error(error);
      alert("Failed to go fullscreen. Your browser may not support this feature.");
      setIsFullscreen(true);
    }
  };

  return (
    <Button className="p-2 absolute left-0 right-0 z-50 w-40 mx-auto mt-3" onClick={goFullscreen}>
      Go Fullscreen
    </Button>
  );
}

export default MobileFullscreenButton;
