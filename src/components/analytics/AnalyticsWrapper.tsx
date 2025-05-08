"use client";

import dynamic from "next/dynamic";

// Dynamically import Google Analytics to avoid SSR issues
const GoogleAnalytics = dynamic(() => import("./GoogleAnalytics"), {
  ssr: false,
});

export default function AnalyticsWrapper() {
  return <GoogleAnalytics />;
}
