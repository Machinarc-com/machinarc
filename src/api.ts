// Frontend API client for the Machinarc backend.
//
// When VITE_API_URL is set (e.g. https://api.machinarc.com), the app talks to the
// real FastAPI backend. When it is not set, the app stays in local-demo mode
// (src/store.ts), so the preview/demo keeps working with no server.

const rawBase = import.meta.env.VITE_API_URL as string | undefined;
const baseUrl = rawBase?.replace(/\/$/, "") ?? "";
const BASE = /^https?:\/\//i.test(baseUrl) ? baseUrl : "";

export const apiEnabled = BASE.length > 0;
export const apiConfigIssue = rawBase && !BASE ? "VITE_API_URL is set but not a valid HTTP(S) URL. The app will use local demo mode instead." : "";

const TOKEN_KEY = "machinarc_jwt";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = (data && (data.detail || data.error?.message)) || res.statusText;
    const code = data && data.error?.code;
    throw new ApiError(typeof detail === "string" ? detail : "Request failed", res.status, code);
  }
  return data as T;
}

export const api = {
  // auth
  register: (email: string, password: string, workspace_name: string) =>
    request<{ access_token: string; email: string; workspace: string }>("POST", "/v1/auth/register", {
      email,
      password,
      workspace_name,
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; email: string; workspace: string }>("POST", "/v1/auth/login", { email, password }),
  me: () => request<{ email: string; workspace: string; workspace_id: string }>("GET", "/v1/auth/me"),
  googleStartUrl: () => `${BASE}/v1/oauth/google/start`,

  // agents
  listAgents: () => request<unknown[]>("GET", "/v1/agents"),
  createAgent: (payload: { name: string; description?: string; environment?: string; capabilities?: string[] }) =>
    request<unknown>("POST", "/v1/agents", payload),
  getAgent: (id: string) => request<unknown>("GET", `/v1/agents/${id}`),
  updateAgent: (id: string, patch: Record<string, unknown>) => request<unknown>("PATCH", `/v1/agents/${id}`, patch),
  deleteAgent: (id: string) => request<unknown>("DELETE", `/v1/agents/${id}`),
  rotateAgent: (id: string) => request<unknown>("POST", `/v1/agents/${id}/rotate`),

  // policies
  setPolicy: (agentId: string, permission: string, allowed: boolean) =>
    request<unknown>("POST", `/v1/agents/${agentId}/policies`, { permission, allowed }),

  // api keys
  listKeys: () => request<unknown[]>("GET", "/v1/api-keys"),
  createKey: (payload: { name: string; environment?: string; permissions?: string }) =>
    request<unknown>("POST", "/v1/api-keys", payload),
  rotateKey: (id: string) => request<unknown>("POST", `/v1/api-keys/${id}/rotate`),
  revokeKey: (id: string) => request<unknown>("DELETE", `/v1/api-keys/${id}`),

  // verify
  verify: (payload: { agent_id: string; token?: string; require?: string }) =>
    request<unknown>("POST", "/v1/verify", payload),

  // audit
  listLogs: (params?: { agentId?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.agentId) q.set("agent_id", params.agentId);
    if (params?.status) q.set("status", params.status);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<unknown[]>("GET", `/v1/audit-logs${qs ? `?${qs}` : ""}`);
  },
};
