import { Console } from "@renderer/components/panels/Console";
import { GamePreview } from "@renderer/components/panels/GamePreview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui/resizable";
import { MIDDLE_PANEL_SIZES } from "@renderer/constants/layout";

export function MiddlePanel() {
  return (
    <ResizablePanelGroup orientation="vertical" className="h-full w-full">
      <ResizablePanel
        defaultSize={MIDDLE_PANEL_SIZES.preview.defaultSize}
        minSize={MIDDLE_PANEL_SIZES.preview.minSize}
        className="overflow-hidden border-b border-border"
      >
        <GamePreview />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={MIDDLE_PANEL_SIZES.console.defaultSize}
        minSize={MIDDLE_PANEL_SIZES.console.minSize}
        className="overflow-hidden"
      >
        <Console />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
