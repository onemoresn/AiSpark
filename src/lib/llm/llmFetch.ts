const REQUEST_TIMEOUT_MS = 25_000;

export async function llmFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyController = new AbortController();
    const proxyTimeout = setTimeout(() => proxyController.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(proxyUrl, { ...init, signal: proxyController.signal });
      clearTimeout(proxyTimeout);
      return response;
    } catch (proxyErr) {
      clearTimeout(proxyTimeout);
      throw proxyErr;
    }
  }
}

export function parseLlmError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const raw = err.message;
    if (/429|too many requests|resource exhausted|rate limit/i.test(raw)) {
      return 'Rate limit exceeded — wait a minute, then try again.';
    }
    try {
      const parsed = JSON.parse(raw) as {
        error?: { message?: string };
        message?: string;
      };
      const msg = parsed.error?.message ?? parsed.message;
      if (msg) {
        if (/429|too many requests|resource exhausted|rate limit/i.test(msg)) {
          return 'Rate limit exceeded — wait a minute, then try again.';
        }
        return msg;
      }
    } catch {
      if (raw) return raw;
    }
  }
  return fallback;
}
