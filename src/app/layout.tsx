import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakranMart — Shop Balochistan & Pakistan",
  description:
    "A modern marketplace for fashion, electronics, home, local crafts and everyday essentials across Balochistan and Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
