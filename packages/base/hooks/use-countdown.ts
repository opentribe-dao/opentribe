"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCountdownString } from "../lib/utils";

export interface UseCountdownResult {
  formatted: string | null;
  isExpired: boolean;
}

/**
 * useCountdown returns a string like "5d:19h:15m" for a future date and
 * updates on the minute. If the time has passed, it returns "Expired".
 */
export function useCountdown(
  target: Date | string | null | undefined
): UseCountdownResult {
  const [now, setNow] = useState<Date>(() => new Date());
  const timerRef = useRef<number | null>(null);

  const { formatted, isExpired } = useMemo(() => {
    if (!target) return { formatted: null, isExpired: false };
    const formatted = formatCountdownString(target, now);
    const deadlineDate = target instanceof Date ? target : new Date(target);
    const expired = Number.isNaN(deadlineDate.getTime())
      ? false
      : deadlineDate.getTime() - now.getTime() <= 0;
    return { formatted, isExpired: expired };
  }, [target, now]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // No target, nothing to run
    if (!target) return;

    const update = () => setNow(new Date());

    // Schedule the next tick at the next minute boundary to minimize drift
    const scheduleNext = () => {
      const current = new Date();
      const msToNextMinute = 60000 - (current.getSeconds() * 1000 + current.getMilliseconds());
      timerRef.current = window.setTimeout(() => {
        update();
        scheduleNext();
      }, Math.max(0, msToNextMinute));
    };

    // Kick off
    update();
    scheduleNext();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [target]);

  return { formatted, isExpired };
}


