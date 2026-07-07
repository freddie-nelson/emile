import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";

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

  const handleNewTab = () => {};

  return (
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

              <Button
                variant="ghost"
                size="icon"
                className="size-5 ml-0 w-0 overflow-hidden opacity-0 scale-75 transition-all duration-200 ease-out group-hover/tab:ml-2 group-hover/tab:w-5 group-hover/tab:opacity-100 group-hover/tab:scale-100 hover:bg-muted-foreground/20 text-destructive hover:text-destructive"
                onClick={(e) => closeTab(e, tab.id)}
                aria-label={`Close ${tab.name}`}
              >
                <X className="size-4" />
              </Button>
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
  );
}
