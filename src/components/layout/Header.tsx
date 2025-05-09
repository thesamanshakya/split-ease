"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User as UserIcon, LogOut } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const isLandingPage = pathname === "/";

  useEffect(() => {
    const getUser = async () => {
      try {
        // Use the session API endpoint with credentials to ensure cookies are sent
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include", // Important: This ensures cookies are sent with the request
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.isLoggedIn && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        setUser(null);
      }
    };

    // Initial user fetch
    getUser();

    // Set up an interval to periodically check the session
    const intervalId = setInterval(getUser, 15000); // Check every 15 seconds

    // Listen for storage events (for cross-tab synchronization)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "auth-state-change") {
        getUser();
      }
    };

    // Also check when the window gets focus
    const handleFocus = () => {
      getUser();
    };

    // Listen for custom auth state change events (for same-tab notification)
    const handleAuthChange = () => {
      getUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("auth-state-change", handleAuthChange);

    // Check if we're on the auth page with a verification parameter
    if (pathname === "/auth" && window.location.search.includes("verification=success")) {
      // If we've just verified email, check auth status immediately
      getUser();
    }

    // Check for URL parameters that might indicate auth state changes
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("login") || urlParams.has("signup") || urlParams.has("reset")) {
      // These parameters might indicate we've just completed an auth flow
      getUser();
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("auth-state-change", handleAuthChange);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      // Use the logout API endpoint instead of direct Supabase auth
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          // Add cache control headers to prevent caching
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign out");
      }

      if (data.success) {
        toast.success("Signed out successfully!");
        setUser(null);

        // Clear any auth-related items from localStorage
        localStorage.removeItem("sb-auth-token");
        localStorage.removeItem("supabase.auth.token");

        // Clear any auth-related cookies
        document.cookie =
          "sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure";
        document.cookie =
          "splitease_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure";

        // Trigger a storage event for cross-tab synchronization
        localStorage.setItem("auth-state-change", Date.now().toString());
        
        // Dispatch a custom event for same-tab notification
        window.dispatchEvent(new Event("auth-state-change"));

        // Force a refresh to ensure the middleware picks up the session change
        router.refresh();

        // Add a small delay before redirecting
        setTimeout(() => {
          // Navigate to auth page
          router.push("/auth");
        }, 300);
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out exception:", error);
      toast.error("An unexpected error occurred during sign out.");

      // Attempt to clear session data anyway in case of API failure
      localStorage.removeItem("sb-auth-token");
      localStorage.removeItem("supabase.auth.token");
      document.cookie =
        "sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure";
      document.cookie =
        "splitease_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure";

      // Dispatch a custom event for same-tab notification
      window.dispatchEvent(new Event("auth-state-change"));

      // Redirect to auth page after a short delay
      setTimeout(() => {
        router.push("/auth");
      }, 1000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Logo className="text-xl" />

        <nav className="hidden md:flex gap-6 text-sm">
          {isLandingPage ? (
            <>
              <Link
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
            </>
          ) : (
            user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    pathname === "/dashboard"
                      ? "text-foreground font-medium"
                      : ""
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/groups"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    pathname.startsWith("/groups")
                      ? "text-foreground font-medium"
                      : ""
                  }`}
                >
                  Groups
                </Link>
              </>
            )
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 px-2"
                >
                  <span>{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link href="/dashboard" className="w-full">
                  <DropdownMenuItem className="cursor-pointer">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/groups" className="w-full">
                  <DropdownMenuItem className="cursor-pointer">
                    <svg
                      className="mr-2 h-4 w-4"
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
                    <span>Groups</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile" className="w-full">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Your Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth?signup=true">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
