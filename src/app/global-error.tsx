"use client";

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
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#171717",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 16px", color: "#525252", lineHeight: 1.5 }}>
            A critical application error occurred.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid #d4d4d4",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#171717",
              color: "#fff",
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
