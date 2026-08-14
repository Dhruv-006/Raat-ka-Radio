import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import InstallAppPrompt from "./components/InstallAppPrompt";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RAAT KA RADIO — रात अभी बाकी है",
  description:
    "A late-night Indian radio experience for everyone who's still awake.",
  keywords: [
    "radio",
    "Indian",
    "nostalgia",
    "late night",
    "music",
    "Hindi",
    "Bollywood",
    "retro",
  ],
  openGraph: {
    title: "RAAT KA RADIO — रात अभी बाकी है",
    description: "A late-night Indian radio experience for everyone who's still awake.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-midnight text-cream">
        <InstallAppPrompt />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
