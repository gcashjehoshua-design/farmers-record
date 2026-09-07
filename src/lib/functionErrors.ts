export async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (!error || typeof error !== "object") return fallback;

  const candidate = error as { message?: string; context?: Response };
  if (candidate.context instanceof Response) {
    try {
      const payload = await candidate.context.clone().json() as { error?: string; message?: string };
      if (payload.error) return payload.error;
      if (payload.message) return payload.message;
    } catch {
      try {
        const text = await candidate.context.clone().text();
        if (text.trim()) return text;
      } catch {
        // Use the friendly fallback below when the response body cannot be read.
      }
    }
  }

  if (candidate.message && !candidate.message.includes("non-2xx")) return candidate.message;
  return fallback;
}

