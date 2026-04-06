import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Tree Builder | Interactive Radial Diagram",
  description: "An elegant, interactive, and open-source radial family tree and organizational chart builder. Configure your JSON and instantly generate beautiful PNG exports.",
  keywords: ["family tree", "organizational chart", "d3.js", "next.js", "radial tree", "open source", "diagram generator"],
  openGraph: {
    title: "Family Tree Builder | Interactive Radial Diagram",
    description: "An elegant, interactive, and open-source radial family tree and organizational chart builder.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
