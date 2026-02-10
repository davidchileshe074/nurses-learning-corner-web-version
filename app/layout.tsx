import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Nurse Learning Corner",
  description: "Your expert companion for nursing excellence.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nurse Corner",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { Navigation } from "@/components/Navigation";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased h-full bg-slate-50 text-slate-900`}
        suppressHydrationWarning={true}
      >
        <GlobalErrorCatcher />
        <AuthGuard>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 overflow-x-hidden md:pb-0 pb-24">
              {children}
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
