"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current user from our session API
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
          console.error("Failed to fetch session:", response.status);
          return;
        }

        const sessionData = await response.json();

        if (sessionData.isLoggedIn && sessionData.user) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Welcome to SplitEase
      </h1>
      <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">
        Split bills effortlessly with friends and keep track of who owes what.
      </p>

      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
