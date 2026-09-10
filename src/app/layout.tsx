import type { Metadata } from "next";
import "./globals.css";

const origin = process.env.APP_ORIGIN || "https://onboard.thedolphy.com";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: "Start Your Project with DOLPHY",
  description:
    "Tell us about your brand, goals, and vision. DOLPHY will turn your answers into a clear plan for your website project.",
  applicationName: "DOLPHY Project Onboarding",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DOLPHY",
    title: "Let’s build something remarkable.",
    description:
      "A thoughtful project intake by DOLPHY — tell us where you are, what you need, and where you want to go.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Start your next website project with DOLPHY",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Let’s build something remarkable.",
    description: "Start your website project with DOLPHY.",
    images: ["/opengraph-image"],
  },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
