import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { GoogleAnalytics } from '@next/third-parties/google';

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SplitEase",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script src="/sw-register.js" defer></script>
      </head>
      <body
        className={`${roboto.variable} ${robotoSlab.variable} font-sans bg-gray-50 min-h-screen`}
      >
        <Header />
        <main className="px-5 py-8">{children}</main>
        <GoogleAnalytics gaId="G-RCRR62ZHSH" />
      </body>
    </html>
  );
}
