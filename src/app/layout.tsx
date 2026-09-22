import type { Metadata } from "next";
import "./globals.css";
import "./product-v2.css";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";

export const metadata: Metadata = {
  title: "MakranMart — Your Online Store",
  description:
    "Shop fashion, electronics, home, local crafts and everyday essentials directly from MakranMart. Pay on delivery and track your orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
