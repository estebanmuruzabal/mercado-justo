import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CartStoreProvider } from "@/stores/cart-store/CartStoreProvider";
import { NotificationRealtimeProvider } from "@/components/notifications/notification-realtime-provider";
import { AuthSessionProvider } from "@/components/auth/auth-session-provider";
import { LocationProvider } from "@/components/location/location-provider";
import "./globals.css";
import Header from "@/components/layout/header/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js + Supabase Starter",
  description: "A modern web application with authentication",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartStoreProvider>
          <NotificationRealtimeProvider>
            <AuthSessionProvider>
            <LocationProvider>
              <Header />
              {children}
            </LocationProvider>
            </AuthSessionProvider>
          </NotificationRealtimeProvider>
        </CartStoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
