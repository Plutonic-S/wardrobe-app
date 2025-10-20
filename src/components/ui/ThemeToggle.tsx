"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
      <div className="flex items-center justify-center">
        <button
          onClick={() => setTheme("light")}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            theme === "light"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={() => setTheme("dark")}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            theme === "dark"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={() => setTheme("system")}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            theme === "system"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          title="System preference"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
