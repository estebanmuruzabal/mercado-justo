import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/shared/config/environment";
import { Toaster } from "@/shared/ui/sonner";
import { CartStoreProvider } from "@/domains/marketplace/checkout/presentation/stores/cart-store/CartStoreProvider";
import { NotificationRealtimeProvider } from "@/domains/community/notifications/presentation/components/notifications/notification-realtime-provider";
import { AuthSessionProvider } from "@/domains/auth/presentation/providers/auth-session-provider";
import { LocationProvider } from "@/shared/maps/location/presentation/location-provider";
import "./globals.css";
import Header from "@/shared/shell/layout/header/header";
import { AppFooter } from "@/shared/shell/layout/footer/app-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Mercado Justo",
    template: "%s | Mercado Justo",
  },
  description:
    "Creá tu tienda digital, conectá con tu comunidad y vendé productos locales.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <CartStoreProvider>
          <NotificationRealtimeProvider>
            <AuthSessionProvider>
            <LocationProvider>
              <Header />
              <div className="flex flex-1 flex-col">{children}</div>
              <AppFooter />
            </LocationProvider>
            </AuthSessionProvider>
          </NotificationRealtimeProvider>
        </CartStoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
