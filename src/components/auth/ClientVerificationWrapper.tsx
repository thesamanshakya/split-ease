"use client";

import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import VerificationHandler from "./VerificationHandler";

export default function ClientVerificationWrapper() {
  return (
    <>
      <Toaster position="top-center" />
      <Suspense fallback={null}>
        <VerificationHandler />
      </Suspense>
    </>
  );
}
