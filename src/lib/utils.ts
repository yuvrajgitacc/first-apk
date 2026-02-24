import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLocal(date: Date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}
