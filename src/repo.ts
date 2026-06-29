// Unified async data layer for the dashboard.
//
// When the backend is configured (VITE_API_URL), every read/write hits the real
// Machinarc API. Otherwise it falls back to the local-demo store so the preview
// keeps working with no server. Both paths return the same store-shaped objects.

import { api, apiEnabled } from "./api";
import {
  createAgent as localCreateAgent,
  createKey as localCreateKey,
  deleteAgent as localDeleteAgent,
  loadDB,
  revokeKey as localRevokeKey,
  rotateAgentKeys as localRotateAgentKeys,
  rotateKey as localRotateKey,
  saveDB,
  setPolicy as localSetPolicy,
  type Agent,
  type ApiKey,
  type Capability,
  type DB,
  type LogEntry,
} from "./store";

export const usingApi = apiEnabled;

// ---- API → store-shape mappers ----
type ApiAgent = {
  id: string;
  name: string;
  owner: string;
  description?: string;
  status: string;
  environment: string;
  public_key: string;
  fingerprint: string;
  policies?: Record<string, boolean>;
  created_at: string;
  last_activity_at?: string | null;
  secret_key?: string;
};

type ApiKeyRow = {
  id: string;
  name: string;
  environment: string;
  prefix: string;
  permissions: string;
  last_used_at?: string | null;
  created_at: string;
  token?: string;
};

type ApiLog = {
  id: string;
  timestamp: string;
  workspace_id: string;
  agent_id: string | null;
  action: string;
  resource: string;
  status: string;
  response_code: number;
  reason?: string | null;
  latency_ms: number;
  ip_address: string;
  request_id: string;
};

function ms(iso?: string | null): number {
  return iso ? new Date(iso).getTime() : Date.now();
}

function mapAgent(a: ApiAgent): Agent {
  return {
    id: a.id,
    workspaceId: "",
    uuid: "",
    name: a.name,
    description: a.description ?? "",
    environment: (a.environment as Agent["environment"]) ?? "development",
    owner: a.owner,
    model: "gpt-5",
    status: a.status === "healthy" ? "active" : (a.status as Agent["status"]),
    publicKey: a.public_key,
    secretKey: a.secret_key ?? "",
    secretHash: "",
    fingerprint: a.fingerprint,
    capabilities: [],
    policies: a.policies ?? {},
    createdAt: ms(a.created_at),
    updatedAt: ms(a.created_at),
    lastActivity: ms(a.last_activity_at),
  };
}

function mapKey(k: ApiKeyRow): ApiKey {
  return {
    id: k.id,
    workspaceId: "",
    name: k.name,
    environment: (k.environment as ApiKey["environment"]) ?? "development",
    keyPrefix: k.prefix,
    hashedSecret: "",
    permissions: (k.permissions as ApiKey["permissions"]) ?? "full",
    token: k.token ?? `${k.prefix}_••••••••`,
    lastUsedAt: k.last_used_at ? ms(k.last_used_at) : null,
    createdAt: ms(k.created_at),
    revokedAt: null,
  };
}

function mapLog(l: ApiLog): LogEntry {
  return {
    id: l.id,
    time: ms(l.timestamp),
    workspaceId: l.workspace_id,
    agentId: l.agent_id,
    agent: l.agent_id ?? "System",
    userId: null,
    apiKeyId: null,
    action: l.action,
    resource: l.resource,
    result: l.status === "blocked" ? "Blocked" : "Success",
    responseCode: l.response_code,
    reason: l.reason ?? undefined,
    latencyMs: l.latency_ms,
    ip: l.ip_address,
    userAgent: "",
    requestId: l.request_id,
  };
}

// ---- snapshot ----
export async function snapshot(): Promise<DB> {
  if (!usingApi) return loadDB();
  const [agents, keys, logs] = await Promise.all([
    api.listAgents() as Promise<ApiAgent[]>,
    api.listKeys() as Promise<ApiKeyRow[]>,
    api.listLogs({ limit: 200 }) as Promise<ApiLog[]>,
  ]);
  // attach agent names to logs for display
  const nameById = new Map(agents.map((a) => [a.id, a.name]));
  return {
    agents: agents.map(mapAgent),
    apiKeys: keys.map(mapKey),
    logs: logs.map((l) => {
      const m = mapLog(l);
      if (m.agentId && nameById.has(m.agentId)) m.agent = nameById.get(m.agentId)!;
      return m;
    }),
  };
}

// ---- agents ----
export async function createAgent(input: {
  name: string;
  description?: string;
  environment?: Agent["environment"];
  capabilities?: Capability[];
}): Promise<{ db: DB; agent: Agent }> {
  if (!usingApi) {
    const { db, agent } = localCreateAgent(loadDB(), input);
    saveDB(db);
    return { db, agent };
  }
  const created = (await api.createAgent({
    name: input.name,
    description: input.description,
    environment: input.environment,
    capabilities: [],
  })) as ApiAgent;
  return { db: await snapshot(), agent: mapAgent(created) };
}

export async function updateAgentStatus(id: string, status: Agent["status"]): Promise<DB> {
  if (!usingApi) {
    const db = loadDB();
    const next = { ...db, agents: db.agents.map((a) => (a.id === id ? { ...a, status } : a)) };
    saveDB(next);
    return next;
  }
  await api.updateAgent(id, { status });
  return snapshot();
}

export async function deleteAgent(id: string): Promise<DB> {
  if (!usingApi) {
    const db = localDeleteAgent(loadDB(), id);
    saveDB(db);
    return db;
  }
  await api.deleteAgent(id);
  return snapshot();
}

export async function rotateAgentKeys(id: string): Promise<{ db: DB; agent?: Agent }> {
  if (!usingApi) {
    const db = localRotateAgentKeys(loadDB(), id);
    saveDB(db);
    return { db, agent: db.agents.find((a) => a.id === id) };
  }
  const rotated = (await api.rotateAgent(id)) as ApiAgent;
  return { db: await snapshot(), agent: mapAgent(rotated) };
}

export async function setPolicy(agentId: string, key: string, allowed: boolean): Promise<DB> {
  if (!usingApi) {
    const db = localSetPolicy(loadDB(), agentId, key, allowed);
    saveDB(db);
    return db;
  }
  await api.setPolicy(agentId, key, allowed);
  return snapshot();
}

// ---- api keys ----
export async function createKey(input: {
  name: string;
  environment: ApiKey["environment"];
  permissions: ApiKey["permissions"];
}): Promise<{ db: DB; key: ApiKey }> {
  if (!usingApi) {
    const { db, key } = localCreateKey(loadDB(), input);
    saveDB(db);
    return { db, key };
  }
  const created = (await api.createKey(input)) as ApiKeyRow;
  return { db: await snapshot(), key: mapKey(created) };
}

export async function rotateKey(id: string): Promise<{ db: DB; key?: ApiKey }> {
  if (!usingApi) {
    const { db, key } = localRotateKey(loadDB(), id);
    saveDB(db);
    return { db, key };
  }
  const rotated = (await api.rotateKey(id)) as ApiKeyRow;
  return { db: await snapshot(), key: mapKey(rotated) };
}

export async function revokeKey(id: string): Promise<DB> {
  if (!usingApi) {
    const db = localRevokeKey(loadDB(), id);
    saveDB(db);
    return db;
  }
  await api.revokeKey(id);
  return snapshot();
}

// ---- verify ----
export type VerifyResult =
  | { verified: true; agent: { id: string; name: string; status: string }; permissions: string[]; verified_at: string }
  | { verified: false; error: { code: string; message: string } };

export async function verify(input: { agentId: string; token?: string; require?: string }): Promise<{ db: DB; result: VerifyResult }> {
  if (!usingApi) {
    const { verify: localVerify } = await import("./store");
    const { db, result } = localVerify(loadDB(), input);
    saveDB(db);
    return { db, result: result as VerifyResult };
  }
  const result = (await api.verify({ agent_id: input.agentId, token: input.token, require: input.require })) as VerifyResult;
  return { db: await snapshot(), result };
}

// ---- logs ----
export async function clearLogs(): Promise<DB> {
  if (!usingApi) {
    const db = loadDB();
    const next = { ...db, logs: [] };
    saveDB(next);
    return next;
  }
  // backend logs are immutable; just refresh
  return snapshot();
}
