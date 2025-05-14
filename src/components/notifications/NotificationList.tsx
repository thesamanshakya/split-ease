"use client";

import { useState } from "react";
import { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (ids?: string[]) => void;
}

export function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
}: NotificationListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense_added":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "settlement_request":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
        );
      case "settlement_completed":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-4 w-4 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "group_invitation":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-4 w-4 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        );
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "expense_added":
      case "settlement_request":
      case "settlement_completed":
        return notification.group_id
          ? `/groups/${notification.group_id}`
          : "/dashboard";
      case "group_invitation":
        return notification.group_id
          ? `/groups/${notification.group_id}`
          : "/groups";
      default:
        return "/dashboard";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead()}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </Button>
        )}
      </div>
      <div className="divide-y">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={getNotificationLink(notification)}
            className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${
              !notification.read ? "bg-blue-50" : ""
            }`}
            onMouseEnter={() => setHoveredId(notification.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (!notification.read) {
                onMarkAsRead([notification.id]);
              }
            }}
          >
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {notification.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {!notification.read && hoveredId === notification.id && (
              <div className="h-2 w-2 rounded-full bg-blue-500 self-center" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
