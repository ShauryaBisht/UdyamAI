import { type ClassValue, clsx } from "clsx"
import { tailwindMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return tailwindMerge(clsx(inputs))
}
