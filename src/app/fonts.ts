import { Tinos, Open_Sans } from "next/font/google";

export const tinos = Tinos({
  subsets: ["latin", "cyrillic"],
  variable: "--font-tinos",
  weight: ["400", "700"],
});

export const openSans = Open_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-open-sans",
  weight: ["300", "400", "700"],
});
