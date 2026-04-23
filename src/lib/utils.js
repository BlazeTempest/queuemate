import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 

// Check if window exists before trying to access it
export const isIframe = typeof window !== "undefined" && window.self !== window.top;
