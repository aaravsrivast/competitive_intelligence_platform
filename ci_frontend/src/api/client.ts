import { useAuthStore } from "@/store/authStore";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  details?: unknown;
};

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    throw new ApiError(
      0,
      "VITE_API_BASE_URL is not set. Copy ci_frontend/.env.example to .env.development for local dev.",
    );
  }
  return base.replace(/\/$/, "");
}

function parseErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.detail === "string") return o.detail;
    if (Array.isArray(o.detail)) {
      return o.detail.map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : String(d))).join("; ");
    }
  }
  return `Request failed (${status})`;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAuth, user, clearAuth } = useAuthStore.getState();
  if (!refreshToken || !user) return null;

  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{
    access_token: string;
    refresh_token: string;
  }> & { detail?: string };

  if (!res.ok || !json.success || !json.data?.access_token) {
    clearAuth();
    return null;
  }

  setAuth({
    user,
    token: json.data.access_token,
    refreshToken: json.data.refresh_token,
  });
  return json.data.access_token;
}

export type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  /** Skip JSON Content-Type (e.g. multipart). */
  rawBody?: BodyInit;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, headers = {}, rawBody } = options;
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const run = async (token: string | null): Promise<Response> => {
    const reqHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    };
    if (auth && token) reqHeaders.Authorization = `Bearer ${token}`;
    if (body !== undefined && rawBody === undefined) {
      reqHeaders["Content-Type"] = "application/json";
    }
    return fetch(url, {
      method,
      headers: reqHeaders,
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  };

  let token = auth ? useAuthStore.getState().token : null;
  let res = await run(token);

  if (auth && res.status === 401 && useAuthStore.getState().refreshToken) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    token = await refreshInFlight;
    if (token) res = await run(token);
  }

  const text = await res.text();
  let json: unknown = {};
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(res.status, text || res.statusText);
    }
  }

  if (!res.ok) {
    const envelope = json as ApiEnvelope<unknown>;
    throw new ApiError(
      res.status,
      parseErrorMessage(res.status, json),
      typeof envelope.code === "string" ? envelope.code : undefined,
    );
  }

  const envelope = json as ApiEnvelope<T>;
  if (envelope && typeof envelope === "object" && "success" in envelope) {
    if (envelope.success === false) {
      throw new ApiError(res.status, envelope.message ?? "Request failed", envelope.code);
    }
    return envelope.data as T;
  }

  return json as T;
}

export async function apiFetchPaginated<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: Omit<ApiFetchOptions, "method" | "body">,
): Promise<T[]> {
  const limit = 200;
  let page = 1;
  const all: T[] = [];

  for (;;) {
    const search = new URLSearchParams();
    search.set("page", String(page));
    search.set("limit", String(limit));
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") search.set(k, String(v));
      }
    }
    const sep = path.includes("?") ? "&" : "?";
    const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}${sep}${search}`;

    const token = options?.auth !== false ? useAuthStore.getState().token : null;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    const json = (await res.json()) as ApiEnvelope<T[]>;
    if (!res.ok || !json.success) {
      throw new ApiError(res.status, parseErrorMessage(res.status, json), json.code);
    }
    const chunk = json.data ?? [];
    all.push(...chunk);
    const pages = json.pages ?? 1;
    if (page >= pages || chunk.length === 0) break;
    page += 1;
  }

  return all;
}
