import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Resend } from "resend";

// export const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenId(uuid: string, visibleChars: number = 6): string {
  if (!uuid || uuid.length <= visibleChars * 2) return uuid;
  return `${uuid.substring(0, visibleChars)}...${uuid.substring(uuid.length - visibleChars)}`;
}

export function formatArgentineNumber(num: number, decimals = 2) {
  // Validate input
  if (isNaN(num)) {
    throw new Error('Input must be a number');
  }

  // Round to specified decimals
  const roundedNum = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Split into integer and decimal parts
  const parts = roundedNum.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : '';

  // Add thousand separators (periods in Argentina)
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Pad decimal part with zeros if needed
  let formattedDecimal = decimalPart.padEnd(decimals, '0');

  // Combine parts (using comma as decimal separator)
  return integerPart + (decimals > 0 ? ',' + formattedDecimal : '');
}
