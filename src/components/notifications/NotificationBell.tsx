"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationList } from "./NotificationList";
import { Notification } from "@/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up interval to periodically check for new notifications
    const intervalId = setInterval(fetchNotifications, 30000); // Check every 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleMarkAsRead = async (ids?: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(ids ? { ids } : { all: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Refresh notifications after marking as read
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    // When opening the dropdown, mark notifications as read
    if (isOpen && unreadCount > 0) {
      // We don't mark them as read immediately to give the user a chance to see what's new
      // Instead, we'll mark them as read when they close the dropdown
    }

    // When closing the dropdown, mark all as read if there were unread notifications
    if (!isOpen && unreadCount > 0) {
      handleMarkAsRead();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <NotificationList
          notifications={notifications}
          loading={loading}
          onMarkAsRead={handleMarkAsRead}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
