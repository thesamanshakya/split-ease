"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { User } from "@/types";
import toast, { Toaster } from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const intervalId = setInterval(getUser, 30000); // Check every 30 seconds

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

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Use the logout API endpoint instead of direct Supabase auth
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important: This ensures cookies are sent with the request
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign out");
      }

      if (data.success) {
        toast.success("Signed out successfully!");
        setUser(null);

        // Trigger a storage event for cross-tab synchronization
        localStorage.setItem("auth-state-change", Date.now().toString());

        // Force a refresh to ensure the middleware picks up the session change
        router.refresh();

        // Navigate to auth page
        router.push("/auth");
      } else {
        throw new Error("Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out exception:", error);
      toast.error("An unexpected error occurred during sign out.");
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold">
            SplitEase
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`hover:text-indigo-200 ${
                    pathname === "/dashboard"
                      ? "text-white font-medium"
                      : "text-indigo-100"
                  }`}
                >
                  Dashboard
                </Link>

                <div className="relative group" ref={dropdownRef}>
                  <button
                    className="flex items-center hover:text-indigo-200"
                    onClick={toggleDropdown}
                  >
                    <span className="mr-1">{user.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`absolute right-0 w-48 bg-white rounded-md shadow-lg py-1 z-10
                      ${
                        dropdownOpen ? "block" : "hidden md:group-hover:block"
                      }`}
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link href="/auth" className="hover:text-indigo-200">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
