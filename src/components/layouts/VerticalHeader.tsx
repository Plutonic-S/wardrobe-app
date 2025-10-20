"use client";

import {
  Bell,
  Home,
  PlusSquare,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { SettingsDropdown } from "./SettingsDropdown";

export function VerticalHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, path: "/feed", label: "Feed" },
    { icon: Shirt, path: "/wardrobe", label: "Wardrobe" },
    { icon: PlusSquare, path: "/create-outfit", label: "Create Outfit" },
    { icon: Bell, path: "/notifications", label: "Notifications" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed left-0 top-0 h-full w-15 border-r border-border bg-background flex flex-col items-center pb-4 shadow-sm">
      <div className="flex flex-col items-center justify-between h-full">
        {/* Top Section - Logo & Nav */}
        <div className="flex flex-col space-y-6 mt-2 items-center">
          {/* Logo */}
          <Button
            variant="ghost"
            className="text-foreground text-2xl font-semibold h-auto p-2 hover:bg-muted/50"
            onClick={() => router.push("/dashboard")}
          >
            DW
          </Button>

          {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="icon"
                className={`relative transition-all duration-200 ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                onClick={() => router.push(item.path)}
                aria-label={item.label}
              >
                <Icon 
                  className="w-6 h-6" 
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 0 : 2}
                />
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Bottom Section - Settings Dropdown */}
        <div className="mb-2">
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
