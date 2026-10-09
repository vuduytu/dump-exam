import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PMP Practice",
  description: "Luyện thi PMP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
