"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, History, LogOut, Menu, Trophy, User, Users } from "lucide-react";
import { logoutAction, selectCertificationAction } from "@/app/actions";
import type { Certification } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Left drawer, closed by default; the ☰ button floats top-left on every signed-in page. */
export function SideMenu({ email, isAdmin, certifications, current }: { email: string; isAdmin: boolean; certifications: Certification[]; current: Certification }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Đề thi", icon: FileText },
    { href: "/drills", label: "Theo chủ đề", icon: BookOpen },
    { href: "/history", label: "Lịch sử", icon: History },
    { href: "/account", label: "Tài khoản", icon: User },
    ...(isAdmin
      ? [
          { href: "/admin", label: "Quản lý User", icon: Users },
          { href: "/admin/scoreboard", label: "Bảng điểm", icon: Trophy },
        ]
      : []),
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="fixed top-2 left-2 z-20" />}>
        <Menu />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-2 p-3">
        <SheetHeader className="p-1">
          <SheetTitle render={<Link href="/" onClick={() => setOpen(false)} />}>PMP Practice</SheetTitle>
        </SheetHeader>
        {/* the picker only matters with access to 2+ Certifications */}
        {certifications.length > 1 && (
          <div role="group" aria-label="Certification" className="flex gap-1 rounded-lg bg-muted p-1">
            {certifications.map((c) => (
              <form key={c} action={selectCertificationAction.bind(null, c)} className="flex-1">
                <Button type="submit" size="sm" variant={c === current ? "default" : "ghost"} aria-pressed={c === current} className="w-full">
                  {c}
                </Button>
              </form>
            ))}
          </div>
        )}
        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(buttonVariants({ variant: pathname === href ? "secondary" : "ghost" }), "justify-start")}
            >
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-auto flex flex-col gap-2 border-t pt-3">
          <span className="truncate px-1 text-sm text-muted-foreground">{email}</span>
          <Button type="submit" variant="outline" className="justify-start">
            <LogOut /> Đăng xuất
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
