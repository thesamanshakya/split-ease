"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { clearPWACache } from "@/utils/cacheUtils";
import toast from "react-hot-toast";

interface CacheRefreshButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function CacheRefreshButton({
  variant = "ghost",
  size = "sm",
  className = "",
  showLabel = true,
}: CacheRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClearCache = async () => {
    setIsRefreshing(true);
    try {
      const success = await clearPWACache();
      
      if (success) {
        toast.success("Cache cleared successfully!");
        // Force reload the page to get fresh content
        window.location.reload();
      } else {
        toast.error("Failed to clear cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("An error occurred while clearing cache");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${isRefreshing ? "animate-spin" : ""}`}
      onClick={handleClearCache}
      disabled={isRefreshing}
      title="Clear PWA cache and refresh"
    >
      <RefreshCw className={`h-4 w-4 ${showLabel ? "mr-2" : ""}`} />
      {showLabel && <span>Refresh App</span>}
    </Button>
  );
}
