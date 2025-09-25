import { parseError } from "@packages/logging/error";
import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export const URL_REGEX =
  /^(https?:\/\/)?([a-z\d]([a-z\d-]*[a-z\d])?\.)+[a-z]{2,6}(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/i;

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
