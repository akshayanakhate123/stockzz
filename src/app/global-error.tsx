"use client";

import { ErrorScreen } from "@/components/error-screen";
import "./globals.css";

// Catches errors in the root layout itself (header, badge toasts), where error.tsx can't reach.
export default function GlobalErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen p-6 pt-16 antialiased">
        <ErrorScreen {...props} />
      </body>
    </html>
  );
}
