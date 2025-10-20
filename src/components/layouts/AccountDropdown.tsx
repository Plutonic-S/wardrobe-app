"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";

export function AccountDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  if (!user) return null;

  // Get user initials for avatar fallback
  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-10 w-10 rounded-full p-0 hover:bg-muted"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} alt={user.username} />
            <AvatarFallback className="bg-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end">
        {/* Profile Section */}
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={undefined} alt={user.username} />
            <AvatarFallback className="bg-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium truncate">@{user.username}</span>
            <span className="text-sm text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Theme Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
          Appearance
        </DropdownMenuLabel>
        <div className="px-2 py-2">
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
