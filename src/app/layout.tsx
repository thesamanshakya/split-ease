import type { Metadata } from "next";
import { Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import AnalyticsWrapper from "@/components/analytics/AnalyticsWrapper";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const robotoSlab = Roboto_Slab({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-slab",
});

export const metadata: Metadata = {
  title: "SplitEase - Split Bills Easily",
  description: "A simple app to split restaurant bills with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add Google Analytics */}
        <AnalyticsWrapper />
      </head>
      <body
        className={`${roboto.variable} ${robotoSlab.variable} font-sans bg-gray-50 min-h-screen`}
      >
        <Header />
        <main className="px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
