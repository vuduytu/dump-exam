import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Timed Attempt length in minutes (PMP exam since 2026-07); shared by server and client. */
export const TIME_LIMIT_MIN = 240;
