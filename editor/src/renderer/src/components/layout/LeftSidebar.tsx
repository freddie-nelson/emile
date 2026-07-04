import { ObjectTabs } from "@renderer/components/panels/ObjectTabs";
import { FileTree } from "@renderer/components/panels/FileTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui/resizable";
import { LEFT_SIDEBAR_SIZES } from "@renderer/constants/layout";

export function LeftSidebar() {
  return (
    <ResizablePanelGroup orientation="vertical" className="h-full w-full">
      <ResizablePanel
        defaultSize={LEFT_SIDEBAR_SIZES.top.defaultSize}
        minSize={LEFT_SIDEBAR_SIZES.top.minSize}
        className="overflow-hidden"
      >
        <ObjectTabs />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={LEFT_SIDEBAR_SIZES.bottom.defaultSize}
        minSize={LEFT_SIDEBAR_SIZES.bottom.minSize}
        className="overflow-hidden border-t border-border"
      >
        <FileTree />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
