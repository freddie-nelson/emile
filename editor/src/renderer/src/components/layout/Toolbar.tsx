import { Toggle } from "@renderer/components/ui/toggle";
import { useTheme } from "@renderer/hooks/useTheme";
import { Moon, PlayIcon, Sun } from "lucide-react";
import { Button } from "../ui/button";

export function Toolbar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="flex h-10 justify-between shrink-0 items-center gap-2 border-b border-border bg-background px-2">
      <Toggle
        size="sm"
        className="px-0"
        aria-label="Toggle theme"
        pressed={theme === "dark"}
        onPressedChange={toggle}
      >
        {theme === "dark" ? <Moon /> : <Sun />}
      </Toggle>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <PlayIcon className="mr-2 h-4 w-4" />
          Run
        </Button>
      </div>
    </header>
  );
}
