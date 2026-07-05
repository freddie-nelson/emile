import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@renderer/components/ui/tabs";
import { Toggle } from "@renderer/components/ui/toggle";
import {
  CONSOLE_FILTERS,
  CONSOLE_TABS,
  type ConsoleFilterId,
  type ConsoleLevel,
  type ConsoleSource,
} from "@renderer/constants/layout";
import { cn } from "@renderer/lib/utils";
import { useMemo, useState } from "react";
import { useConsole } from "./useConsole";
import { Button } from "../ui/button";

const LEVEL_TEXT: Record<ConsoleLevel, string> = {
  error: "text-destructive",
  warning: "text-warning",
  stdout: "text-muted-foreground",
};

const LEVEL_ICON = Object.fromEntries(CONSOLE_FILTERS.map((f) => [f.level, f.icon])) as Record<
  ConsoleLevel,
  (typeof CONSOLE_FILTERS)[number]["icon"]
>;

const ALL_FILTERS = new Set<ConsoleFilterId>(CONSOLE_FILTERS.map((f) => f.id));

export function Console() {
  const { entries, clear } = useConsole();
  const [source, setSource] = useState<ConsoleSource>(CONSOLE_TABS[0].id);
  const [filters, setFilters] = useState<Set<ConsoleFilterId>>(() => new Set(ALL_FILTERS));

  const visible = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.source === source &&
          CONSOLE_FILTERS.some((f) => f.level === e.level && filters.has(f.id)),
      ),
    [entries, source, filters],
  );

  const toggleFilter = (id: ConsoleFilterId) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-1 py-1">
        <Tabs value={source} onValueChange={(v) => setSource(v as ConsoleSource)} className="flex">
          <TabsList variant="line" className="h-7">
            {CONSOLE_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-1">
          {CONSOLE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const enabled = filters.has(filter.id);

            return (
              <Toggle
                key={filter.id}
                size="sm"
                className="px-0"
                aria-label={filter.label}
                pressed={enabled}
                onPressedChange={() => toggleFilter(filter.id)}
              >
                <Icon className={LEVEL_TEXT[filter.level]} />
              </Toggle>
            );
          })}
          <Button size="sm" variant="outline" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col py-1 font-mono text-xs">
          {visible.map((entry) => {
            const Icon = LEVEL_ICON[entry.level];
            return (
              <li key={entry.id} className="flex items-start gap-2 px-2 py-0.5 hover:bg-muted">
                <Icon className={cn("mt-0.5 size-3.5 shrink-0", LEVEL_TEXT[entry.level])} />
                <span className="shrink-0 text-muted-foreground">{entry.timestamp}</span>
                <span className={cn("min-w-0 wrap-break-word", LEVEL_TEXT[entry.level])}>
                  {entry.message}
                </span>
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-2 py-1 text-muted-foreground">No output</li>}
        </ul>
      </ScrollArea>
    </div>
  );
}
