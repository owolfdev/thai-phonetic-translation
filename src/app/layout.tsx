import type { Metadata, Viewport } from "next";
import { Noto_Serif_Thai, Space_Mono } from "next/font/google";

import { PwaRegistrar } from "@/components/pwa-registrar";

import "./globals.css";

const uiFont = Space_Mono({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const thaiFont = Noto_Serif_Thai({
  variable: "--font-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Thai Language Studio",
  description:
    "Translate English and phonetic Thai into Thai script with OpenAI, complete with RTGS, tones, and client-side Thai speech playback.",
  manifest: "/manifest.webmanifest",
  applicationName: "Thai Language Studio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Thai Language Studio",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#184a45",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${uiFont.variable} ${thaiFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
