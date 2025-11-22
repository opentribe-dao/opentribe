"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-white/70">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            className="rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
