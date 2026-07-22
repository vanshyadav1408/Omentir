"use client";

import { useEffect } from "react";

/**
 * Root error boundary for failures in the root layout itself.
 * Must define its own <html> and <body> — it replaces the root layout when active.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'var(--font-google-sans), Roboto, "Helvetica Neue", Arial, sans-serif',
          background: "#fbfaf6",
          color: "#171717",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "3.5rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "#ba3871",
            lineHeight: 1,
          }}
        >
          Oops
        </p>
        <h1
          style={{
            margin: "16px 0 0",
            fontSize: "1.75rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong.
        </h1>
        <p
          style={{
            margin: "16px 0 0",
            maxWidth: "28rem",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "#52525b",
          }}
        >
          We hit an unexpected error. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "32px",
            height: "48px",
            padding: "0 32px",
            border: "none",
            borderRadius: "100px",
            background: "#ba3871",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
