const TRANSIENT = /network|fetch failed|timeout|timed out|temporarily|503|502|504|econnreset|socket|rate limit/i;

export function isTransient(message: unknown) {
  return TRANSIENT.test(String(message ?? ""));
}

/**
 * Runs a server call and retries transient failures (network blips, gateway
 * errors) with a short exponential backoff. Result objects shaped
 * `{ error: string }` are treated as failures too.
 */
export async function withRetry<T>(
  run: () => Promise<T>,
  options: { retries?: number; onRetry?: (attempt: number) => void } = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await run();
      const errorText =
        result && typeof result === "object" && "error" in (result as Record<string, unknown>)
          ? String((result as Record<string, unknown>)["error"])
          : null;
      if (errorText && isTransient(errorText) && attempt < retries) {
        lastError = new Error(errorText);
      } else {
        return result;
      }
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!isTransient(message) || attempt === retries) throw error;
    }
    options.onRetry?.(attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
