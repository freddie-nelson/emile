import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Pencil, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { toTitleCase } from "@renderer/helpers/string";

export enum TabType {
  Browser = "browser",
}

export interface BrowserTab {
  id: string;
  type: TabType.Browser;
  name: string;
  data: {
    url: string;
  };
}

export type Tab = BrowserTab;

const defaultTabs: Tab[] = [
  {
    id: "client-preview",
    type: TabType.Browser,
    name: "Client Preview",
    data: {
      url: "http://localhost:3000",
    },
  } satisfies BrowserTab,
  {
    id: "colyseus-playground",
    type: TabType.Browser,
    name: "Colyseus Playground",
    data: {
      url: "http://localhost:2567",
    },
  } satisfies BrowserTab,
  {
    id: "colyseus-monitor",
    type: TabType.Browser,
    name: "Colyseus Monitor",
    data: {
      url: "http://localhost:2567/colyseus",
    },
  } satisfies BrowserTab,
];

export function TabsViewer() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const tabIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTab === id) {
      setActiveTab(null);
    }
  };

  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const currentEditingTab = editingTab ? tabs.find((t) => t.id === editingTab?.id) : null;

  const handleNewTab = () => {};

  const handleEditTab = (e: React.FormEvent) => {
    e.preventDefault();

    setTabs((tabs) => tabs.map((t) => (t.id === editingTab?.id ? editingTab : t)));
    setEditingTab(null);
  };

  return (
    <>
      <Tabs tabIndex={tabIndex} onValueChange={(v) => setActiveTab(v)}>
        <div className="flex gap-0 border-b-border border-b">
          <TabsList className="w-full bg-background justify-start p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="group/tab w-max h-full flex-[unset] px-3 gap-0"
              >
                <span>{tab.name}</span>

                <div className="flex gap-0 group-hover/tab:opacity-100 group-hover/tab:ml-2 group-hover/tab:gap-2 opacity-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 ml-0 w-0 overflow-hidden opacity-100 scale-75 transition-all duration-200 ease-out group-hover/tab:w-5 group-hover/tab:scale-100 hover:bg-muted-foreground/20 text-accent hover:text-accent"
                    onClick={() => setEditingTab(tab)}
                    aria-label={`Edit ${tab.name}`}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 ml-0 w-0 overflow-hidden opacity-100 scale-75 transition-all duration-200 ease-out group-hover/tab:w-5 group-hover/tab:scale-100 hover:bg-muted-foreground/20 text-destructive hover:text-destructive"
                    onClick={(e) => closeTab(e, tab.id)}
                    aria-label={`Close ${tab.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <Button
            variant="outline"
            className="self-stretch aspect-square rounded-none w-8"
            aria-label="New Tab"
            onClick={handleNewTab}
          >
            <Plus className="text-primary hover:text-primary" />
          </Button>
        </div>
      </Tabs>

      <Dialog open={!!editingTab} onOpenChange={(open) => !open && setEditingTab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tab "{currentEditingTab?.name}"</DialogTitle>
          </DialogHeader>

          <form className="flex flex-col gap-5" onSubmit={handleEditTab}>
            <FieldGroup>
              <Field data-invalid={!editingTab?.name}>
                <FieldLabel htmlFor="editing-tab-name-input">Name</FieldLabel>
                <Input
                  aria-invalid={!editingTab?.name}
                  placeholder="Tab Name"
                  autoComplete="off"
                  id="editing-tab-name-input"
                  name="Name"
                  value={editingTab?.name}
                  onChange={(e) => setEditingTab({ ...editingTab!, name: e.target.value })}
                  required
                />
              </Field>

              {Object.entries(editingTab?.data ?? {}).map(([k, v]) => (
                <Field key={k}>
                  <FieldLabel htmlFor={`editing-tab-${k}-input`}>{toTitleCase(k)}</FieldLabel>
                  <Input
                    placeholder={k}
                    autoComplete="off"
                    id={`editing-tab-${k}-input`}
                    name={k}
                    value={typeof v === "object" ? JSON.stringify(v) : v}
                    onChange={(e) =>
                      setEditingTab({
                        ...editingTab!,
                        data: {
                          ...editingTab!.data,
                          [k]:
                            typeof v === "object"
                              ? JSON.parse(e.target.value)
                              : typeof v === "boolean"
                                ? e.target.value === "true"
                                : typeof v === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </FieldGroup>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                size="sm"
                className="w-24"
                variant="destructive"
                onClick={() => setEditingTab(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="w-24">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
