import { ChevronRight, Pencil, Plus, Scroll, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@renderer/components/ui/button";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { ENTITY_TABS, type EntityTabId } from "@renderer/constants/layout";

import {
  type EditorComponent,
  type EditorEntity,
  type EditorItem,
  type EditorSystem,
  type UseObjectList,
  useObjectTabs,
} from "./useObjectTabs";
import { ObjectTreeNode, TreeList } from "../shared/TreeList";

type ObjectLists = {
  entities: UseObjectList<EditorEntity>;
  components: UseObjectList<EditorComponent>;
  systems: UseObjectList<EditorSystem>;
};

function ItemList({
  items,
  selectedId,
  onSelect,
  onEdit,
}: {
  items: EditorItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onEdit(item.id)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-muted ${
                selectedId === item.id ? "bg-accent" : ""
              }`}
            >
              <span className="truncate text-foreground">{item.name}</span>
              <span className="shrink-0 text-muted-foreground">{item.meta}</span>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

function buildObjectTree(items: EditorEntity[]): ObjectTreeNode[] {
  const nodes = new Map<string, ObjectTreeNode>();
  for (const item of items) {
    nodes.set(item.id, { ...item, children: [] });
  }
  const roots: ObjectTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function ObjectTabs() {
  const { entities, components, systems } = useObjectTabs();
  const lists: ObjectLists = { entities, components, systems };

  const [activeTab, setActiveTab] = useState<EntityTabId>(ENTITY_TABS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const active = lists[activeTab];

  const handleCreate = () => active.create(selectedId);

  const handleDelete = () => {
    if (!selectedId) return;
    active.remove(selectedId);
    setSelectedId(null);
  };

  const handleEdit = (id: string) => {
    active.update(id, { name: "Edited" });
  };

  const handleExpand = (id: string, isExpanded: boolean) => {
    active.update(id, { isExpanded });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => {
        setActiveTab(v as EntityTabId);
        setSelectedId(null);
      }}
      className="flex h-full w-full flex-col gap-0"
    >
      <TabsList className="flex min-w-full justify-start">
        {ENTITY_TABS.map((tab) => {
          return (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="flex items-center justify-end gap-1 border-b border-border px-1 py-1">
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Delete"
          onClick={handleDelete}
          disabled={!selectedId}
        >
          <Trash2 className="text-destructive hover:text-destructive" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Edit"
          onClick={() => selectedId && handleEdit(selectedId)}
          disabled={!selectedId}
        >
          <Pencil className="text-muted-foreground hover:text-foreground" />
        </Button>
        <Button variant="outline" size="icon-xs" aria-label="Create new" onClick={handleCreate}>
          <Plus className="text-primary hover:text-primary" />
        </Button>
      </div>
      {ENTITY_TABS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="min-h-0 flex-1">
          {tab.id === "entities" ? (
            <ScrollArea className="h-full">
              <TreeList
                items={buildObjectTree(lists[tab.id].items)}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={handleEdit}
                onDragEnd={(sourceItem, targetItem) => {
                  if (targetItem) {
                    lists[tab.id].move?.(sourceItem.id, targetItem.id);
                  } else {
                    lists[tab.id].move?.(sourceItem.id, null);
                  }
                }}
                onExpand={handleExpand}
              />
            </ScrollArea>
          ) : (
            <ItemList
              items={lists[tab.id].items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={handleEdit}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
