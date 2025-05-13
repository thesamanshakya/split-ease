"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a login or signup success redirect
    const loginStatus = searchParams.get("login");
    const signupStatus = searchParams.get("signup");

    // Use localStorage to ensure we only show the toast once per session
    const hasShownLoginToast = localStorage.getItem("login_toast_shown");
    const hasShownSignupToast = localStorage.getItem("signup_toast_shown");

    // Handle login success
    if (loginStatus === "success" && !hasShownLoginToast) {
      // Set flag to prevent showing the toast multiple times
      localStorage.setItem("login_toast_shown", "true");

      // Show success message
      toast.success("Signed in successfully!", {
        duration: 3000,
        style: {
          background: "#333",
          color: "#fff",
        },
        id: "login-success", // Add an ID to prevent duplicate toasts
      });

      // Trigger a storage event for cross-tab synchronization
      localStorage.setItem("auth-state-change", Date.now().toString());

      // Dispatch a custom event for same-tab notification
      window.dispatchEvent(new Event("auth-state-change"));

      // Clear the flag after some time
      setTimeout(() => {
        localStorage.removeItem("login_toast_shown");
      }, 60000);
    }

    // Handle signup success
    if (signupStatus === "success" && !hasShownSignupToast) {
      // Set flag to prevent showing the toast multiple times
      localStorage.setItem("signup_toast_shown", "true");

      // Show success message
      toast.success("Account created successfully!", {
        duration: 4000,
        style: {
          background: "#333",
          color: "#fff",
        },
        id: "signup-success", // Add an ID to prevent duplicate toasts
      });

      // Trigger a storage event for cross-tab synchronization
      localStorage.setItem("auth-state-change", Date.now().toString());

      // Dispatch a custom event for same-tab notification
      window.dispatchEvent(new Event("auth-state-change"));

      // Clear the flag after some time
      setTimeout(() => {
        localStorage.removeItem("signup_toast_shown");
      }, 60000);
    }
  }, [searchParams]);

  return null;
}
