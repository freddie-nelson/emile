import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useOrientation } from "../../hooks/useOrientation";

function LandscapeAlert() {
  const isMobile = useIsMobile();

  const orientation = useOrientation();
  const isLandscape = orientation === "landscape";

  const [closed, setClosed] = useState(false);

  if (!isMobile || isLandscape || closed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-auto p-6 bg-black text-white flex flex-col gap-3">
      <div className="flex justify-between items-center gap-6">
        <h1 className="text-xl font-bold">Rotate your device</h1>

        <button className="text-3xl font-bold" onClick={() => setClosed(true)}>
          ×
        </button>
      </div>
      <p>
        Our game works best on mobile when played in landscape mode, please rotate your device into landscape
        mode for the best experience.
      </p>
    </div>
  );
}

export default LandscapeAlert;
