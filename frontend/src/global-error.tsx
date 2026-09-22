"use client";

// global-error.tsx — the last resort. Next only renders this if the ROOT
// layout.tsx itself throws (error.tsx can't help there, since error.tsx
// renders *inside* the layout). Because it replaces the whole layout, it has
// to render its own <html>/<body> and stay deliberately dependency-light —
// if layout.tsx is broken, importing theme/AppChrome/etc. here risks the
// same crash taking this down too.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#6b7280" }}>
            The application hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              borderRadius: 999,
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              background: "#B11226",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
