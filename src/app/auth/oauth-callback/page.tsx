"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { toast, Toaster } from "react-hot-toast";

// Component that uses searchParams
function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the callback URL from the query parameters
        const callbackUrl = searchParams.get("callback_url");
        const isSignup = searchParams.get("signup") === "true";
        
        if (!callbackUrl) {
          throw new Error("Missing callback URL");
        }

        console.log("Processing OAuth callback", { callbackUrl, isSignup });

        // Extract the hash or query parameters from the callback URL
        const url = new URL(callbackUrl);
        const hashParams = url.hash ? new URLSearchParams(url.hash.substring(1)) : null;
        
        // Check if we have a session already
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session already exists, proceeding to login");
          // We already have a session, proceed to login
          completeLogin(isSignup);
          return;
        }
        
        // If we have hash parameters, we need to exchange the token
        if (hashParams && hashParams.get("access_token")) {
          console.log("Found access token in hash, setting session");
          
          // Set the session from the hash
          const { data, error } = await supabase.auth.setSession({
            access_token: hashParams.get("access_token") || "",
            refresh_token: hashParams.get("refresh_token") || "",
          });
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            // Session created successfully
            completeLogin(isSignup);
            return;
          }
        }
        
        // If we don't have a session or hash parameters, try to exchange the code
        const code = url.searchParams.get("code");
        if (code) {
          console.log("Found code parameter, exchanging for session");
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            // Session created successfully
            completeLogin(isSignup);
            return;
          }
        }
        
        // If we reach here, we couldn't create a session
        throw new Error("Failed to create session from OAuth callback");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setProcessing(false);
        
        // Show error toast
        toast.error("Authentication failed. Please try again.", {
          duration: 5000,
        });
        
        // Redirect to auth page after a delay
        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      }
    };
    
    const completeLogin = async (isSignup: boolean) => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("No session available");
        }
        
        // Use the login API endpoint to create an Iron session
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
          body: JSON.stringify({ 
            provider: "google",
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to create session");
        }
        
        if (data.success) {
          // Trigger a storage event for cross-tab synchronization
          localStorage.setItem("auth-state-change", Date.now().toString());
          
          // Dispatch a custom event for same-tab notification
          window.dispatchEvent(new Event("auth-state-change"));
          
          // Show success message
          toast.success(isSignup ? "Account created successfully!" : "Signed in successfully!", {
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
          });
          
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          throw new Error("Failed to establish session");
        }
      } catch (err) {
        console.error("Session creation error:", err);
        setError(err instanceof Error ? err.message : "Session creation failed");
        setProcessing(false);
        
        // Show error toast
        toast.error("Failed to create session. Please try again.", {
          duration: 5000,
        });
        
        // Redirect to auth page after a delay
        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      }
    };
    
    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          {processing ? "Completing Authentication" : error ? "Authentication Error" : "Authentication Complete"}
        </h1>
        
        {processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-center">
              Please wait while we complete your authentication...
            </p>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">
            <p className="mb-4">{error}</p>
            <p className="text-gray-600">Redirecting you back to the login page...</p>
          </div>
        ) : (
          <div className="text-green-600 text-center">
            <p className="mb-4">Authentication successful!</p>
            <p className="text-gray-600">Redirecting you to the dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
            <p className="text-gray-600">Loading authentication handler...</p>
          </div>
        </div>
      }>
        <OAuthCallbackHandler />
      </Suspense>
    </div>
  );
}
