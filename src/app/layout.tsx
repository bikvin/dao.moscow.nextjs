import { tinos } from "@/app/fonts";
import "./globals.css";

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
