import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { cn } from "@renderer/lib/utils";
import { ChevronRight, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

export const TREE_LIST_ROOT_ID = "TREE_LIST_ROOT";

export interface ObjectTreeNode {
  id: string;
  parentId: string | null;
  name: string;
  meta: string;
  children: ObjectTreeNode[];
  isExpanded?: boolean;
}

export interface TreeListProps {
  items: ObjectTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDragEnd: (sourceItem: ObjectTreeNode, targetItem: ObjectTreeNode | null) => void;
  onExpand: (id: string, isExpanded: boolean) => void;
  className?: string;
  depth?: number;
  renderItem?: (item: ObjectTreeNode, depth: number, isExpanded: boolean) => React.ReactNode;
}

export function TreeList(props: TreeListProps) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        const sourceItem = event.operation.source?.data?.item as ObjectTreeNode | undefined;
        if (!sourceItem) {
          return;
        }

        const targetItem = (event.operation.target?.data?.item ?? null) as ObjectTreeNode | null;
        if (targetItem && targetItem.id === sourceItem.id) {
          return;
        }

        props.onDragEnd(sourceItem, targetItem);
      }}
    >
      <TreeListDropTarget>
        <TreeListHelper {...props} depth={props.depth || 0} />
      </TreeListDropTarget>
    </DragDropProvider>
  );
}

function TreeListDropTarget({ children }: { children: React.ReactNode }) {
  const { isDropTarget, ref } = useDroppable({
    id: TREE_LIST_ROOT_ID,
  });

  return (
    <div ref={ref} className={cn("flex flex-col h-full", isDropTarget && "bg-primary/20!")}>
      {children}
    </div>
  );
}

function TreeListHelper({
  items,
  selectedId,
  onSelect,
  onEdit,
  onExpand,
  className,
  depth,
  renderItem,
}: Omit<TreeListProps, "onDragEnd">) {
  return (
    <div className={`flex flex-col ${className || ""}`}>
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          depth={depth || 0}
          renderItem={renderItem}
          onExpand={onExpand}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  item: ObjectTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onExpand: (id: string, isExpanded: boolean) => void;
  className?: string;
  depth: number;
  noChildren?: boolean;
  renderItem?: (item: ObjectTreeNode, depth: number, isExpanded: boolean) => React.ReactNode;
}

function TreeNode({
  item,
  selectedId,
  onSelect,
  onEdit,
  onExpand,
  className,
  depth,
  noChildren,
  renderItem,
}: TreeNodeProps) {
  const { ref: dragRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
  const { isDropTarget, ref: dropRef } = useDroppable({
    id: item.id,
    data: { item },
  });

  return (
    <div className={`${className || ""}`}>
      <div className="w-full bg-background" ref={dropRef}>
        <button
          type="button"
          ref={dragRef}
          onClick={() => {
            onSelect(item.id);
            onExpand(item.id, !item.isExpanded);
          }}
          onDoubleClick={() => onEdit(item.id)}
          className={`flex w-full items-center gap-1 px-2 py-1.5 text-xs hover:bg-muted ${
            selectedId === item.id ? "bg-accent" : "bg-background"
          } ${isDragging ? "opacity-70" : ""} ${isDropTarget ? "bg-primary/20!" : ""}`}
          style={{ paddingLeft: depth ? `${depth * 1.5}rem` : undefined }}
        >
          {item.children.length > 0 && (
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                item.isExpanded && "rotate-90",
              )}
            />
          )}

          {renderItem ? (
            renderItem(item, depth, item.isExpanded ?? false)
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <span className="truncate text-foreground text-left">{item.name}</span>
              <span className="shrink-0 text-muted-foreground">{item.meta}</span>
            </div>
          )}
        </button>
      </div>

      {!noChildren && item.children.length > 0 && item.isExpanded && (
        <TreeListHelper
          items={item.children}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          className={className}
          depth={depth + 1}
          renderItem={renderItem}
          onExpand={onExpand}
        />
      )}
    </div>
  );
}
