import { randomId, toTitleCase } from "@renderer/helpers/string";
import { Copy, Pencil, Plus, RefreshCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { GuestDialog, GuestDialogRequest, GuestDialogResult } from "./GuestDialog";
import { BrowserTab, Tab, TabType } from "./Tabs";
import { TabWebview } from "./TabWebview";

const defaultTabs: Tab[] = [
  {
    id: "client-preview",
    type: TabType.Browser,
    name: "Client Preview",
    isLoading: true,
    error: "",
    data: {
      url: "http://localhost:3333",
    },
  } satisfies BrowserTab,
  {
    id: "colyseus-playground",
    type: TabType.Browser,
    name: "Colyseus Playground",
    isLoading: true,
    error: "",
    data: {
      url: "http://localhost:2567",
    },
  } satisfies BrowserTab,
  {
    id: "colyseus-monitor",
    type: TabType.Browser,
    name: "Colyseus Monitor",
    isLoading: true,
    error: "",
    data: {
      url: "http://localhost:2567/colyseus",
    },
  } satisfies BrowserTab,
];

export function TabsViewer() {
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const tabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const updateTab = (id: string, newTab: Partial<Tab>) => {
    setTabs((tabs) => tabs.map((t) => (t.id === id ? { ...t, ...newTab } : t)));
  };

  const webviews = useRef(new Map<string, Electron.WebviewTag>());

  // Dialogs opened by pages, which stay blocked until the matching one is answered here.
  const [contentsToTab, setContentsToTab] = useState<Record<number, string>>({});
  const [dialogs, setDialogs] = useState<GuestDialogRequest[]>([]);

  useEffect(() => {
    const offOpen = window.electron.ipcRenderer.on(
      "guest-dialog",
      (_e, request: GuestDialogRequest) => setDialogs((prev) => [...prev, request]),
    );
    const offCancel = window.electron.ipcRenderer.on(
      "guest-dialog-cancel",
      (_e, requestId: number) =>
        setDialogs((prev) => prev.filter((d) => d.requestId !== requestId)),
    );

    return () => {
      offOpen();
      offCancel();
    };
  }, []);

  // Only the tab being viewed shows its dialog, the others wait until it is selected.
  const activeDialog = dialogs.find((d) => contentsToTab[d.webContentsId] === activeTabId);

  const answerDialog = (requestId: number, result: GuestDialogResult) => {
    window.electron.ipcRenderer.send("guest-dialog-result", requestId, result);
    setDialogs((prev) => prev.filter((d) => d.requestId !== requestId));
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    setTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTabId === id) {
      setActiveTabId(null);
    }
  };

  const duplicateTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    const tab = tabs.find((t) => t.id === id);
    if (!tab) {
      return;
    }

    let nameCount = 1;
    while (tabs.some((t) => t.name === `${tab.name} (${nameCount})`)) {
      nameCount++;
    }

    setTabs((tabs) =>
      tabs.flatMap((t) =>
        t.id === id
          ? [t, { ...structuredClone(t), name: `${t.name} (${nameCount})`, id: randomId() }]
          : t,
      ),
    );
  };

  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const currentEditingTab = editingTab ? tabs.find((t) => t.id === editingTab?.id) : null;

  const handleNewTab = () => {};

  const handleEditTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTab) {
      return;
    }

    const saved = { ...editingTab, isLoading: true, currentUrl: undefined };

    setTabs((tabs) => tabs.map((t) => (t.id === saved.id ? saved : t)));
    setEditingTab(null);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <Tabs
        tabIndex={tabIndex}
        onValueChange={(v) => {
          setActiveTabId(v);
        }}
      >
        <div className="flex gap-0 border-b-border border-b">
          <TabsList className="w-full bg-background justify-start p-0 overflow-x-auto overflow-y-hidden tiny-scrollbar">
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
                    className="size-5 ml-0 w-0 overflow-hidden opacity-100 scale-75 transition-all duration-200 ease-out group-hover/tab:w-5 group-hover/tab:scale-100 hover:bg-muted-foreground/20 text-accent hover:text-accent"
                    onClick={(e) => duplicateTab(e, tab.id)}
                    aria-label={`Duplicate ${tab.name}`}
                  >
                    <Copy className="size-3" />
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

      <div className="w-full flex-1 overflow-hidden relative">
        {tabs.map((t) => (
          // Inactive tabs are hidden with visibility, not display: none, so their webviews keep their size and state.
          <div
            key={t.id}
            className={`absolute inset-0 ${t.id === activeTabId ? "" : "invisible pointer-events-none"}`}
          >
            {t.isLoading && (
              <div className="absolute top-0 left-0 w-full h-full bg-background flex justify-center items-center">
                <Spinner className="size-8" />
              </div>
            )}

            {t.error && (
              <div className="absolute top-0 left-0 w-full h-full bg-background flex justify-center items-center text-center flex-col">
                <h2 className="text-xl font-medium text-destructive">Error While Loading Tab</h2>
                <p className="text-destructive">{t.error}</p>
                <Button
                  variant="destructive"
                  className="mt-2 w-32"
                  onClick={() => {
                    updateTab(t.id, { isLoading: true, error: "" });
                    webviews.current.get(t.id)?.reload();
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            {t?.type === TabType.Browser && (
              <div className="flex flex-col w-full h-full">
                <div className="w-full bg-card border-b border-b-border flex justify-between items-center gap-4">
                  <p className="text-[11px] font-mono text-muted-foreground p-1">
                    {t.currentUrl ?? t.data.url}
                  </p>

                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="h-full aspect-square!"
                    onClick={() => {
                      updateTab(t.id, { isLoading: true, error: "" });
                      webviews.current.get(t.id)?.reload();
                    }}
                  >
                    <RefreshCcw className="size-3" />
                  </Button>
                </div>

                <TabWebview
                  ref={(el) => {
                    if (el) {
                      webviews.current.set(t.id, el);
                    } else {
                      webviews.current.delete(t.id);
                    }
                  }}
                  id={t.id}
                  url={t.data.url}
                  onLoadStart={() => updateTab(t.id, { isLoading: true, error: "" })}
                  onLoadStop={() => updateTab(t.id, { isLoading: false })}
                  onNavigate={(url) => updateTab(t.id, { currentUrl: url })}
                  onError={(error) => updateTab(t.id, { isLoading: false, error })}
                  onAttach={(contentsId) =>
                    setContentsToTab((prev) =>
                      prev[contentsId] === t.id ? prev : { ...prev, [contentsId]: t.id },
                    )
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {activeDialog && activeTab && (
        <GuestDialog
          key={activeDialog.requestId}
          request={activeDialog}
          tabName={activeTab.name}
          onResult={(result) => answerDialog(activeDialog.requestId, result)}
        />
      )}

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
    </div>
  );
}
