"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the login API endpoint instead of direct Supabase auth
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // Important: This ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      if (data.success) {
        // Trigger a storage event for cross-tab synchronization
        localStorage.setItem("auth-state-change", Date.now().toString());

        // Force a refresh to ensure the middleware picks up the session
        router.refresh();

        // Add a small delay to ensure the session is properly set
        setTimeout(() => {
          // Navigate to dashboard
          router.push("/dashboard");
        }, 500);
      } else {
        throw new Error("Failed to establish session");
      }
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during sign in";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Move the verification check to a separate component
  const VerificationCheck = () => {
    const searchParams = useSearchParams();

    useEffect(() => {
      // Check if this is a verification redirect
      const verification = searchParams.get("verification");

      // Use localStorage to ensure we only show the toast once per session
      const hasShownVerificationToast = localStorage.getItem(
        "verification_toast_shown"
      );

      if (verification === "success" && !hasShownVerificationToast) {
        // Set flag to prevent showing the toast multiple times
        localStorage.setItem("verification_toast_shown", "true");

        // Show success message
        toast.success(
          "Email verified successfully! Please log in to continue.",
          {
            duration: 5000,
            style: {
              background: "#333",
              color: "#fff",
            },
            id: "verification-success", // Add an ID to prevent duplicate toasts
          }
        );

        // Clear the flag after some time (e.g., 1 minute)
        setTimeout(() => {
          localStorage.removeItem("verification_toast_shown");
        }, 60000);
      }
    }, [searchParams]);

    return null;
  };

  return (
    <div>
      <Suspense fallback={null}>
        <VerificationCheck />
      </Suspense>
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
