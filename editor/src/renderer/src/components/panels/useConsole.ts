import { useState } from "react";

export type ConsoleSource = "client" | "server";
export type ConsoleLevel = "error" | "warning" | "stdout";
export type ConsoleFilterId = "errors" | "warnings" | "stdout";

export interface ConsoleEntry {
  id: string;
  source: ConsoleSource;
  level: ConsoleLevel;
  message: string;
  timestamp: string;
}

const mockEntries: ConsoleEntry[] = [
  {
    id: "1",
    source: "client",
    level: "stdout",
    message: "Client connected to game session",
    timestamp: "12:00:01",
  },
  {
    id: "2",
    source: "client",
    level: "warning",
    message: "Asset 'sprites.png' exceeds 4MB",
    timestamp: "12:00:03",
  },
  {
    id: "3",
    source: "client",
    level: "error",
    message: "Failed to load entity 'enemy': missing component 'RigidBody'",
    timestamp: "12:00:04",
  },
  {
    id: "4",
    source: "server",
    level: "stdout",
    message: "Server listening on :7777",
    timestamp: "12:00:00",
  },
  {
    id: "5",
    source: "server",
    level: "warning",
    message: "Tick budget exceeded by 2.1ms",
    timestamp: "12:00:05",
  },
  {
    id: "6",
    source: "server",
    level: "error",
    message: "Player 3 dropped: connection reset",
    timestamp: "12:00:09",
  },
];

export interface UseConsoleResult {
  entries: ConsoleEntry[];
  clear: () => void;
}

/** Mock console log entries across client and server sources. */
export function useConsole(): UseConsoleResult {
  const [entries, setEntries] = useState<ConsoleEntry[]>(mockEntries);

  return {
    entries,
    clear: () => {
      setEntries([]);
    },
  };
}
