import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import PasswordProtection from "@/components/PasswordProtection";
import { Analytics } from "@vercel/analytics/react"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Investinex",
  description: "Your personal assistant for knowledge and discovery.",
  icons: {
    icon: [
      { url: "/avatar.png", sizes: "32x32" },
      { url: "/avatar.png", sizes: "16x16" },
    ],
    apple: [{ url: "/avatar.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics/>
        <PasswordProtection>{children}</PasswordProtection>
      </body>
    </html>
  );
}
