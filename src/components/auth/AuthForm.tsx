"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

export default function AuthForm() {
  const [view, setView] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setView("sign-in")}
              className={`flex-1 py-4 text-center font-medium ${
                view === "sign-in"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setView("sign-up")}
              className={`flex-1 py-4 text-center font-medium ${
                view === "sign-up"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {view === "sign-in" ? <SignIn /> : <SignUp />}
          </div>
        </div>
      </div>
    </div>
  );
}
