import { LeftSidebar } from "@renderer/components/layout/LeftSidebar";
import { MiddlePanel } from "@renderer/components/layout/MiddlePanel";
import { RightSidebar } from "@renderer/components/layout/RightSidebar";
import { Toolbar } from "@renderer/components/layout/Toolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui/resizable";
import { COLUMN_SIZES } from "@renderer/constants/layout";

export function EditorLayout() {
  return (
    <div className="flex h-screen w-full flex-col">
      <Toolbar />
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize={COLUMN_SIZES.left.defaultSize}
          minSize={COLUMN_SIZES.left.minSize}
          maxSize={COLUMN_SIZES.left.maxSize}
          className="overflow-hidden"
        >
          <LeftSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={COLUMN_SIZES.middle.defaultSize}
          minSize={COLUMN_SIZES.middle.minSize}
          className="overflow-hidden"
        >
          <MiddlePanel />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={COLUMN_SIZES.right.defaultSize}
          minSize={COLUMN_SIZES.right.minSize}
          maxSize={COLUMN_SIZES.right.maxSize}
          className="overflow-hidden"
        >
          <RightSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
