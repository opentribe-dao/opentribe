import { parseError } from "@packages/logging/error";
import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export const URL_REGEX =
  /^(https?:\/\/)?([a-z\d]([a-z\d-]*[a-z\d])?\.)+[a-z]{2,6}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/i;

export const OPTIONAL_URL_REGEX =
  /^((https?:\/\/)?([a-z\d]([a-z\d-]*[a-z\d])?\.)+[a-z]{2,6}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?)?$/i;

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const handleError = (error: unknown): void => {
  const message = parseError(error);

  toast.error(message);
};

export const relativeTime = (time: Date): string => {
  const now = new Date();
  const activityDate = new Date(time);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeak = Math.floor(diffDay / 7);

  const timeFormats = [
    {
      check: diffWeak < 1,
      value: `a week${diffWeak > 1 ? "s" : ""} ago`,
    },
    {
      check: diffDay >= 1,
      value: activityDate.toLocaleDateString(),
    },
    {
      check: diffHour >= 1,
      value: `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`,
    },
    {
      check: diffMin >= 1,
      value: `${diffMin} min${diffMin > 1 ? "s" : ""} ago`,
    },
  ];

  const found = timeFormats.find((f) => f.check);
  return found ? found.value : "just now";
};

/**
 * Format a number as currency with appropriate abbreviations
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1.2K", "$5.3M", "$2.1B")
 */
// Use formatCurrency for:
// - Dashboard cards with limited space
// - Summary statistics
// - Mobile UI where space is premium
// formatCurrency(1234567) // "$1.2M"
export const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  } else {
    return `$${value}`;
  }
};

/**
 * Format a number as currency using Intl.NumberFormat for accuracy
 * @param amount - The numeric value to format
 * @param locale - The locale for formatting (default: "en-US")
 * @param currency - The currency code (default: "USD")
 * @returns Formatted currency string using browser's internationalization
 */
// Use formatAmount for:
// - Financial data where accuracy is critical
// - User-facing amounts in forms
// - International applications
// formatAmount(1234567) // "$1,234,567"
export const formatAmount = (
  amount: number, 
  locale: string = "en-US", 
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Interface for deadline information returned by getDeadlineInfo
 */
export interface DeadlineInfo {
  timeRemaining: string | null;
  isExpired: boolean;
  isSoon: boolean;
}

/**
 * Get deadline information including time remaining, expiration status, and urgency
 * @param deadline - The deadline date (Date object, string, or null/undefined)
 * @returns Object containing time remaining text, expiration status, and urgency flag
 */
export const getDeadlineInfo = (deadline: Date | string | null | undefined): DeadlineInfo => {
  if (!deadline)
    return { timeRemaining: null, isExpired: false, isSoon: false };

  try {
    const deadlineDate =
      deadline instanceof Date ? deadline : new Date(deadline);
    const now = new Date();

    // Check if the date is valid
    if (Number.isNaN(deadlineDate.getTime())) {
      return { timeRemaining: null, isExpired: false, isSoon: false };
    }

    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If deadline has passed
    if (diffTime <= 0) {
      // Calculate how long ago the deadline was
      const absDiffTime = Math.abs(diffTime);
      const diffDays = Math.floor(absDiffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((absDiffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((absDiffTime % (1000 * 60 * 60)) / (1000 * 60));

      let agoText = "";
      if (diffDays >= 30) {
        const diffMonths = Math.floor(diffDays / 30);
        agoText = `Completed ${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
      } else if (diffDays > 0) {
        agoText = `Completed ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        agoText = `Completed ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else if (diffMinutes > 0) {
        agoText = `Completed ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
      } else {
        agoText = "Completed just now";
      }

      return { timeRemaining: agoText, isExpired: true, isSoon: false };
    }

    // Check if deadline is soon (within 7 days)
    const isSoon = diffDays <= 7;

    // Calculate time remaining display
    const diffDaysFloor = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor(
      (diffTime % (1000 * 60 * 60)) / (1000 * 60)
    );

    let timeRemaining: string;
    if (diffDaysFloor > 0) {
      timeRemaining = `Due in ${diffDaysFloor} day${
        diffDaysFloor !== 1 ? "s" : ""
      }`;
    } else if (diffHours > 0) {
      timeRemaining = `Due in ${diffHours} hour${
        diffHours !== 1 ? "s" : ""
      } ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      timeRemaining = `Due in ${diffMinutes} minute${
        diffMinutes !== 1 ? "s" : ""
      }`;
    } else {
      timeRemaining = "Due very soon";
    }

    return { timeRemaining, isExpired: false, isSoon };
  } catch {
    return { timeRemaining: null, isExpired: false, isSoon: false };
  }
};
