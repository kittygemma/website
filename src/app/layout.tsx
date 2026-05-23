import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hello Kitty Fan Page",
  description: "A fan-made tribute to Hello Kitty — built with Next.js and Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
