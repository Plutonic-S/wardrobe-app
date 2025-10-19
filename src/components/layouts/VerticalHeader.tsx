"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shirt,
  Sparkles,
  Heart,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalHeaderProps {
  isAuthenticated?: boolean;
  user?: {
    username: string;
    displayName: string;
  } | null;
  onLogout?: () => void;
}

export function VerticalHeader({
  isAuthenticated = false,
  user = null,
  onLogout,
}: VerticalHeaderProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navigationLinks = [
    { href: "/", label: "Home", icon: Home, auth: false },
    { href: "/wardrobe", label: "Wardrobe", icon: Shirt, auth: true },
    { href: "/outfits", label: "Outfits", icon: Sparkles, auth: true },
    { href: "/feed", label: "Feed", icon: Heart, auth: false },
  ];

  return (
    <header className="fixed right-0 top-0 h-screen w-20 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border-l border-zinc-800 flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-110"
      >
        <Shirt className="w-6 h-6 text-white" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-4 w-full px-3">
        {navigationLinks.map((link) => {
          // Hide auth-required links if not authenticated
          if (link.auth && !isAuthenticated) return null;

          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative group flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                active
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              )}
              title={link.label}
            >
              <Icon className="w-6 h-6" />

              {/* Active indicator */}
              {active && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full" />
              )}

              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
                {link.label}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-zinc-800" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="flex flex-col items-center gap-3 w-full px-3 mt-auto pt-6 border-t border-zinc-800">
        {isAuthenticated && user ? (
          <>
            {/* User Profile */}
            <Link
              href="/profile"
              className={cn(
                "relative group flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                isActive("/profile")
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              )}
              title="Profile"
            >
              <User className="w-6 h-6" />

              {/* Tooltip with username */}
              <div className="absolute right-full mr-3 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
                <div className="font-semibold">{user.displayName}</div>
                <div className="text-xs text-zinc-400">@{user.username}</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-zinc-800" />
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="relative group flex items-center justify-center w-14 h-14 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />

              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Logout
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-zinc-800" />
              </div>
            </button>
          </>
        ) : (
          <>
            {/* Login Button */}
            <Link
              href="/login"
              className={cn(
                "relative group flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                isActive("/login")
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              )}
              title="Login"
            >
              <LogIn className="w-6 h-6" />

              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Login
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-zinc-800" />
              </div>
            </Link>

            {/* Signup Button */}
            <Link
              href="/signup"
              className={cn(
                "relative group flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                isActive("/signup")
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105"
              )}
              title="Sign Up"
            >
              <UserPlus className="w-6 h-6" />

              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Sign Up
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-zinc-800" />
              </div>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
