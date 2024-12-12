import type { Metadata } from "next";
import { tinos } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boilerplate. Login. No password recovery.",
  description: "Boilerplate. Login. No password recovery.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${tinos.variable} `}>
      <body
        className={`font-tinos overflow-x-hidden  bg-repeat`} //bg-[url('/img/bg.jpg')]
      >
        {children}
      </body>
    </html>
  );
}
