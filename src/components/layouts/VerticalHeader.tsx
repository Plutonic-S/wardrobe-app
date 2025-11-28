"use client";

import {
  Calendar,
  Home,
  PlusSquare,
  Shirt,
  PieChart,
  MoreVertical,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { SettingsDropdown } from "./SettingsDropdown";

export function VerticalHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, path: "/feed", label: "Feed" },
    { icon: Shirt, path: "/wardrobe", label: "Wardrobe" },
    { icon: PlusSquare, path: "/outfits", label: "Create Outfit" },
    { icon: Calendar, path: "/calendar", label: "Calendar" },
    { icon: PieChart, path: "/analytics", label: "Analytics" },
  ];

  // For mobile: main navigation items (first 3)
  const mobileMainItems = navItems.slice(0, 3);

  // For mobile: dropdown menu items (notifications, analytics)
  const mobileMenuItems = [
    { icon: Calendar, path: "/calendar", label: "Calendar" },
    { icon: PieChart, path: "/analytics", label: "Analytics" },
    { icon: Settings, path: "/settings", label: "Settings" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Desktop/Tablet - Vertical Left Sidebar */}
      <header className="hidden md:flex fixed left-0 top-0 h-full w-15 border-r border-border bg-background flex-col items-center pb-4 shadow-sm">
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

      {/* Mobile - Bottom Horizontal Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background shadow-lg z-50">
        <div className="flex items-center justify-around h-full px-2">
          {/* Main Navigation Items (Home, Wardrobe, Create) */}
          {mobileMainItems.map((item) => {
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
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-600 rounded-b-full" />
                )}
              </Button>
            );
          })}

          {/* More Menu (3 dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative transition-all duration-200 ${
                  ["/notifications", "/analytics", "/settings"].includes(pathname)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                aria-label="More options"
              >
                <MoreVertical className="w-6 h-6" />
                {["/notifications", "/analytics", "/settings"].includes(pathname) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-600 rounded-b-full" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
              {mobileMenuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <div key={item.path}>
                    <DropdownMenuItem
                      onClick={() => router.push(item.path)}
                      className={`cursor-pointer ${
                        active ? "bg-muted text-foreground" : ""
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                    {index === 1 && <DropdownMenuSeparator />}
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
