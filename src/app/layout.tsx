import type { Metadata } from "next";
import { playfairDisplay, libreBaskerville } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boilerplate. Login. No password recovery.",
  description: "Boilerplate. Login. No password recovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${playfairDisplay.variable} ${libreBaskerville.variable}`}
    >
      <body className={`font-baskerville overflow-x-hidden`}>{children}</body>
    </html>
  );
}
