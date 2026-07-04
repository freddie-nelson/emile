import {
  ConsoleFilterId,
  ConsoleLevel,
  ConsoleSource,
} from "@renderer/components/panels/useConsole";
import { AlertCircle, AlertTriangle, type LucideIcon, Terminal } from "lucide-react";

/** Horizontal column split (top-level). Sizes are percentages (strings, 0-100). */
export const COLUMN_SIZES = {
  left: { defaultSize: "16%", minSize: "12%", maxSize: "30%" },
  middle: { defaultSize: "60%", minSize: "30%" },
  right: { defaultSize: "16%", minSize: "12%", maxSize: "30%" },
} as const;

/** Vertical split inside the left sidebar. */
export const LEFT_SIDEBAR_SIZES = {
  top: { defaultSize: "50%", minSize: "20%" },
  bottom: { defaultSize: "50%", minSize: "20%" },
} as const;

/** Vertical split inside the middle panel (preview / console). */
export const MIDDLE_PANEL_SIZES = {
  preview: { defaultSize: "65%", minSize: "25%" },
  console: { defaultSize: "35%", minSize: "15%" },
} as const;

export type EntityTabId = "entities" | "components" | "systems";

export const ENTITY_TABS: { id: EntityTabId; label: string }[] = [
  { id: "entities", label: "Entities" },
  { id: "components", label: "Components" },
  { id: "systems", label: "Systems" },
];

export type FileTreeTabId = "game" | "client" | "server" | "shared" | "state";

export const FILE_TREE_TABS: { id: FileTreeTabId; label: string }[] = [
  { id: "game", label: "Game" },
  { id: "client", label: "Client" },
  { id: "server", label: "Server" },
  { id: "shared", label: "Shared" },
  { id: "state", label: "State" },
];

export const CONSOLE_TABS: { id: ConsoleSource; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "server", label: "Server" },
];

export const CONSOLE_FILTERS: {
  id: ConsoleFilterId;
  label: string;
  level: ConsoleLevel;
  icon: LucideIcon;
}[] = [
  { id: "errors", label: "Errors", level: "error", icon: AlertCircle },
  { id: "warnings", label: "Warnings", level: "warning", icon: AlertTriangle },
  { id: "stdout", label: "Stdout", level: "stdout", icon: Terminal },
];
