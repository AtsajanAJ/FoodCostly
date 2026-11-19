type SafeLogContext = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE_KEY =
  /(password|secret|token|authorization|cookie|session|database_url|api[_-]?key)/i;

/**
 * Structured server logging that redacts sensitive keys.
 * Hook point for future error monitoring (e.g. Sentry) without leaking secrets.
 */
export function reportError(
  error: unknown,
  context: SafeLogContext = {},
): void {
  const safeContext: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY.test(key)) {
      safeContext[key] = "[redacted]";
      continue;
    }
    if (value === undefined) continue;
    safeContext[key] = value;
  }

  const message =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      at: new Date().toISOString(),
      error: message,
      context: safeContext,
    }),
  );
}
