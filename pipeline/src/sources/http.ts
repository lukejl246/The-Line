export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  retries?: number;
  /** Base wait before retrying a 429/5xx; doubles each attempt. */
  backoffMs?: number;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const retries = options.retries ?? 5;
  let backoff = options.backoffMs ?? 20_000;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: options.headers });
    if (res.ok) return (await res.json()) as T;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) {
      throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
    }
    console.warn(`  ${res.status} on ${url.slice(0, 80)}… retrying in ${backoff / 1000}s`);
    await sleep(backoff);
    backoff *= 2;
  }
}
