"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Floats top-right on every page; the layout's inline script applies the saved choice before paint. */
export function ThemeToggle() {
  function toggle() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }
  return (
    <Button variant="outline" size="icon" className="fixed top-2 right-2 z-20" onClick={toggle}>
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
      <span className="sr-only">Đổi giao diện sáng/tối</span>
    </Button>
  );
}
