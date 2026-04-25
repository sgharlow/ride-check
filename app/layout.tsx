import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RideCheck — public-data risk profile for any used car",
  description:
    "A clear A–F risk profile for any year/make/model, computed from public NHTSA data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
