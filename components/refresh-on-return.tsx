"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const shown = new Set<string>(); // server renders already mounted in this tab

/**
 * Back/Forward restores the Router Cache (or the browser's bfcache) copy of a page as it was first rendered. Mounting a
 * render we have already shown, or a bfcache restore, means the copy may be stale: fetch a fresh one. A first visit costs
 * nothing extra. `renderId` must be unique per server render.
 */
export function RefreshOnReturn({ renderId }: { renderId: string }) {
  const router = useRouter();
  const [restored] = useState(() => shown.has(renderId)); // read at render: StrictMode's double effect cannot fake a return
  useEffect(() => void shown.add(renderId), [renderId]);
  useEffect(() => {
    if (restored) router.refresh();
    const onShow = (e: PageTransitionEvent) => e.persisted && router.refresh();
    addEventListener("pageshow", onShow);
    return () => removeEventListener("pageshow", onShow);
  }, [restored, router]);
  return null;
}
