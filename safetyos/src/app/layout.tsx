import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Protect } from "@/components/protect";

export const metadata: Metadata = {
  title: "SafetyOS — One Platform. Complete Workplace Safety.",
  description:
    "Multi-tenant Health, Safety & Environment (HSE) management SaaS for Manufacturing, Mining, Construction, Warehousing, Logistics and Process Plants.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Protect />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
