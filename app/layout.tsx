import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Header } from "@/components/header";
import { ThemeToggle } from "@/components/theme-toggle";
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

// Runs before paint: saved choice, else the OS setting. ThemeToggle writes the same key.
const themeScript = `try{var t=localStorage.getItem("theme")}catch(e){}document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="pt-12 lg:pt-0">
        <Header />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
