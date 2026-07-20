import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Blues Dance Vienna Registration",
  description: "Registration form builder for Blues Dance Vienna classes.",
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
