import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DOLPHY — Project Start",
  description:
    "Good things start with a conversation. Tell DOLPHY a little about your next website.",
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
