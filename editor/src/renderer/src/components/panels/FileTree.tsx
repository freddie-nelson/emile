import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { FILE_TREE_TABS, type FileTreeTabId } from "@renderer/constants/layout";
import { cn } from "@renderer/lib/utils";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

import { type FileTreeNode, useFileTree } from "./useFileTree";

function TreeItem({ node, depth }: { node: FileTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.type === "file") {
    return (
      <div
        className="flex items-center gap-1 py-1 pr-2 text-xs hover:bg-muted"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <File className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-foreground">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1 py-1 pr-2 text-xs hover:bg-muted"
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
        {expanded ? (
          <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-foreground">{node.name}</span>
      </button>
      {expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeView({ nodes }: { nodes: FileTreeNode[] }) {
  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        {nodes.map((node) => (
          <TreeItem key={node.id} node={node} depth={0} />
        ))}
      </div>
    </ScrollArea>
  );
}

export function FileTree() {
  const trees = useFileTree();

  return (
    <Tabs defaultValue={FILE_TREE_TABS[0].id} className="flex h-full w-full flex-col gap-0">
      <TabsList className="flex min-w-full justify-start">
        {FILE_TREE_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FILE_TREE_TABS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="min-h-0 flex-1">
          <TreeView nodes={trees[tab.id as FileTreeTabId]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
