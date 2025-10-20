"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, HelpCircle, Shield, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function SettingsDropdown() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" side="right">
        <DropdownMenuItem 
          onClick={() => router.push("/settings")} 
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/help-center")} 
          className="cursor-pointer"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help Center</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={() => router.push("/privacy-policy")} 
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy Policy</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/terms-of-service")} 
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Terms of Service</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
