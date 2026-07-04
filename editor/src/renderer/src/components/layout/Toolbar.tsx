import { Toggle } from "@renderer/components/ui/toggle";
import { useTheme } from "@renderer/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export function Toolbar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-2">
      <Toggle
        size="sm"
        className="px-0"
        aria-label="Toggle theme"
        pressed={theme === "dark"}
        onPressedChange={toggle}
      >
        {theme === "dark" ? <Moon /> : <Sun />}
      </Toggle>
    </header>
  );
}
