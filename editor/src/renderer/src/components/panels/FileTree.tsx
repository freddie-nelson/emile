import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { FILE_TREE_TABS, type FileTreeTabId } from "@renderer/constants/layout";
import { File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

import { type FileTreeNode, useFileTree } from "./useFileTree";
import { type ObjectTreeNode, TreeList } from "@renderer/components/shared/TreeList";

function toObjectTree(nodes: FileTreeNode[], parentId: string | null = null): ObjectTreeNode[] {
  return nodes.map((node) => ({
    id: node.id,
    parentId,
    name: node.name,
    meta: node.type,
    children: node.children ? toObjectTree(node.children, node.id) : [],
  }));
}

function FileTreeItem(item: ObjectTreeNode, depth: number, isOpen: boolean) {
  const isFolder = item.meta === "folder";

  return (
    <div className="flex w-full items-center gap-1.5">
      {isFolder ? (
        isOpen ? (
          <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        )
      ) : (
        <File className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate text-foreground text-left">{item.name}</span>
    </div>
  );
}

function TreeView({ nodes }: { nodes: FileTreeNode[] }) {
  const items = toObjectTree(nodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ScrollArea className="h-full">
      <TreeList
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={() => {}}
        onDragEnd={() => {}}
        renderItem={(item, depth, isOpen) => FileTreeItem(item, depth, isOpen)}
        onExpand={() => {}}
      />
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
