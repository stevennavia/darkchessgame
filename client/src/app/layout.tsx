import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dark Chess - Cursed Ritual Battle",
  description: "A multiplayer dark fantasy chess game with Soulslike aesthetics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
