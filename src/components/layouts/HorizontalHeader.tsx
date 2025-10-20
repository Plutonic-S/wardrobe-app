"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { AccountDropdown } from "./AccountDropdown";
import { useState } from "react";

export function HorizontalHeader() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="h-15 w-full bg-background border-b border-border flex flex-row items-center justify-between px-6 shadow-sm">
      {/* Search Section - Takes all available width */}
      <div className="relative flex-1 mr-4">
        <div
          className={`relative flex items-center transition-all duration-200 ${
            isSearchFocused
              ? "bg-background border border-border rounded-lg p-2"
              : ""
          }`}
        >
          {!isSearchFocused && (
            <Search className="absolute left-3 text-muted-foreground w-4 h-4 pointer-events-none" />
          )}
          <Input
            placeholder="Search"
            className={`border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${
              !isSearchFocused ? "pl-10" : "pl-3"
            }`}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>

        {/* Search Recommendations Container */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              Search recommendations will appear here
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Profile Only */}
      <AccountDropdown />
    </header>
  );
}