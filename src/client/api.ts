import { handleMockApi } from "./lib/mock-store";

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    const opts: RequestInit = { method, headers: {} };
    if (body !== undefined) {
      (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const r = await fetch(path, opts);
    let data: unknown = null;
    try {
      data = await r.json();
    } catch {
      /* empty body */
    }
    if (r.ok && data) {
      return data as T;
    }
    // If backend returns non-ok status or html error on Vercel, fallback to Mock API
    return await handleMockApi<T>(method, path, body);
  } catch {
    // On network failure or Vercel static deployment without backend worker, fallback to Mock API
    return await handleMockApi<T>(method, path, body);
  }
}
