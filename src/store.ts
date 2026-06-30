// Client-side "database" + "auth" for the MVP.
// In production this maps to FastAPI + PostgreSQL + JWT; here we persist to localStorage.

export type Capability = "Email" | "CRM" | "Calendar" | "Files" | "Payments";

export type Environment = "development" | "production";

export type Agent = {
  id: string; // ag_...
  workspaceId: string;
  uuid: string;
  name: string;
  description: string;
  environment: Environment;
  owner: string;
  model: string;
  status: "active" | "paused" | "revoked";
  publicKey: string;
  secretKey: string;
  secretHash: string;
  fingerprint: string;
  capabilities: Capability[];
  policies: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
  lastActivity: number;
};

// Public shape returned by the API (no secret key)
export type AgentPublic = {
  id: string;
  name: string;
  owner: string;
  status: Agent["status"];
  public_key: string;
  fingerprint: string;
  created_at: string;
};

export type KeyPermission = "full" | "read" | "custom";

export type ApiKey = {
  id: string;
  workspaceId: string;
  name: string;
  environment: Environment;
  keyPrefix: string; // mk_live | mk_test
  hashedSecret: string;
  permissions: KeyPermission;
  token: string; // full secret, kept only client-side for one-time reveal
  lastUsedAt: number | null;
  createdAt: number;
  revokedAt: number | null;
};

export type LogEntry = {
  id: string;
  time: number;
  workspaceId: string;
  agentId: string | null;
  agent: string;
  userId: string | null;
  apiKeyId: string | null;
  action: string;
  resource: string;
  result: "Success" | "Blocked";
  responseCode: number;
  reason?: string;
  latencyMs: number;
  ip: string;
  userAgent: string;
  requestId: string;
};

export type Session = { email: string; org: string };

// ---- Phase 1: users + workspaces schema ----
export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
};

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: number;
  updated_at: number;
};

type DB = {
  agents: Agent[];
  apiKeys: ApiKey[];
  logs: LogEntry[];
};

const DB_KEY = "machinarc_db";
const SESSION_KEY = "machinarc_session";

export const ALL_CAPABILITIES: Capability[] = ["Email", "CRM", "Calendar", "Files", "Payments"];

// Every permission is an object: resource + action -> a stable key.
export type PermissionDef = {
  key: string; // e.g. "gmail:read"
  label: string; // e.g. "Read Gmail"
  resource: string; // policy group, e.g. "Gmail"
  action: string; // e.g. "read"
  sensitive?: boolean;
};

export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: "gmail:read", label: "Read Gmail", resource: "Gmail", action: "read" },
  { key: "gmail:send", label: "Send Email", resource: "Gmail", action: "send" },
  { key: "gmail:delete", label: "Delete Email", resource: "Gmail", action: "delete", sensitive: true },
  { key: "calendar:read", label: "Read Calendar", resource: "Calendar", action: "read" },
  { key: "calendar:write", label: "Create Events", resource: "Calendar", action: "write" },
  { key: "crm:read", label: "Read CRM", resource: "CRM", action: "read" },
  { key: "crm:write", label: "Edit CRM", resource: "CRM", action: "write" },
  { key: "crm:export", label: "Export Database", resource: "CRM", action: "export", sensitive: true },
  { key: "stripe:read", label: "Read Payments", resource: "Stripe", action: "read" },
  { key: "stripe:transfer", label: "Stripe Transfer", resource: "Stripe", action: "transfer", sensitive: true },
];

// Group the catalog into policies (resources).
export const PERMISSION_GROUPS: { resource: string; permissions: PermissionDef[] }[] = Array.from(
  PERMISSION_CATALOG.reduce((map, p) => {
    const list = map.get(p.resource) ?? [];
    list.push(p);
    map.set(p.resource, list);
    return map;
  }, new Map<string, PermissionDef[]>()),
).map(([resource, permissions]) => ({ resource, permissions }));

// Backwards-compatible flat label list (used by older views).
export const POLICY_OPTIONS = PERMISSION_CATALOG.map((p) => p.label);

export function permissionByLabel(label: string): PermissionDef | undefined {
  return PERMISSION_CATALOG.find((p) => p.label === label);
}

function rand(len = 10) {
  let s = "";
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.slice(0, len);
}

function uid(prefix: string) {
  return `${prefix}_${rand(8)}`;
}

function randomIp() {
  const r = () => Math.floor(Math.random() * 255) + 1;
  return `${r()}.${r()}.${r()}.${r()}`;
}

function randomLatency() {
  return Math.floor(60 + Math.random() * 240);
}

const USER_AGENT = "machinarc-sdk/1.0 (+https://machinarc.com)";

function seedLog(
  time: number,
  agent: string,
  agentId: string,
  action: string,
  resource: string,
  result: LogEntry["result"],
  responseCode: number,
  latencyMs: number,
  reason?: string,
): LogEntry {
  return {
    id: uid("log"),
    time,
    workspaceId: "ws_seed",
    agentId,
    agent,
    userId: null,
    apiKeyId: null,
    action,
    resource,
    result,
    responseCode,
    reason,
    latencyMs,
    ip: "203.0.113.24",
    userAgent: USER_AGENT,
    requestId: uid("req"),
  };
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function makeKeys() {
  const publicKey = `pk_live_${rand(24)}`;
  const secretKey = `sk_live_${rand(32)}`;
  const secretHash = hashPassword(secretKey);
  const fingerprint = `fp_${rand(16)}`;
  return { publicKey, secretKey, secretHash, fingerprint };
}

function keyPrefixFor(env: Environment): string {
  return env === "production" ? "mk_live" : "mk_test";
}

function makeApiSecret(env: Environment): { token: string; keyPrefix: string; hashedSecret: string } {
  const keyPrefix = keyPrefixFor(env);
  const token = `${keyPrefix}_${rand(32)}`;
  return { token, keyPrefix, hashedSecret: hashPassword(token) };
}

function seed(): DB {
  const now = Date.now();
  const k1 = makeKeys();
  const k2 = makeKeys();
  return {
    agents: [
      {
        id: "ag_8f3a2b9c",
        workspaceId: "ws_seed",
        uuid: uuidv4(),
        name: "Customer Support",
        description: "Handles inbound customer email and scheduling.",
        environment: "production",
        owner: "Acme Inc.",
        model: "gpt-5",
        status: "active",
        ...k1,
        updatedAt: now - 1000 * 60 * 120,
        capabilities: ["Email", "CRM", "Calendar"],
        policies: {
          "gmail:read": true,
          "gmail:send": true,
          "gmail:delete": false,
          "calendar:read": true,
          "crm:read": true,
          "stripe:transfer": false,
        },
        createdAt: now - 1000 * 60 * 120,
        lastActivity: now - 1000 * 60 * 6,
      },
      {
        id: "ag_2c7d9e0a",
        workspaceId: "ws_seed",
        uuid: uuidv4(),
        name: "Sales Agent",
        description: "Qualifies leads and updates the CRM.",
        environment: "production",
        owner: "Acme Inc.",
        model: "gpt-5",
        status: "active",
        ...k2,
        updatedAt: now - 1000 * 60 * 60 * 24,
        capabilities: ["Email", "CRM"],
        policies: { "gmail:read": true, "gmail:send": true, "crm:read": true, "crm:write": true },
        createdAt: now - 1000 * 60 * 60 * 24,
        lastActivity: now - 1000 * 60 * 30,
      },
    ],
    apiKeys: [
      {
        id: uid("key"),
        workspaceId: "ws_seed",
        name: "Production",
        environment: "production",
        ...makeApiSecret("production"),
        permissions: "full",
        lastUsedAt: now - 1000 * 60 * 6,
        createdAt: now - 1000 * 60 * 120,
        revokedAt: null,
      },
    ],
    logs: [
      seedLog(now - 1000 * 60 * 8, "Customer Support", "ag_8f3a2b9c", "Read Email", "gmail", "Success", 200, 112),
      seedLog(now - 1000 * 60 * 7, "Customer Support", "ag_8f3a2b9c", "Send Email", "gmail", "Success", 200, 143),
      seedLog(now - 1000 * 60 * 6, "Customer Support", "ag_8f3a2b9c", "Delete Email", "gmail", "Blocked", 403, 38, "Permission Denied"),
    ],
  };
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const fresh = seed();
      saveDB(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as DB;
    // migrate older records missing new identity fields
    let changed = false;
    parsed.agents = (parsed.agents ?? []).map((a) => {
      const next = { ...a } as Agent;
      if (!next.uuid) {
        next.uuid = uuidv4();
        changed = true;
      }
      if (!next.secretKey || !next.fingerprint) {
        const k = makeKeys();
        next.publicKey = next.publicKey ?? k.publicKey;
        next.secretKey = next.secretKey ?? k.secretKey;
        next.fingerprint = next.fingerprint ?? k.fingerprint;
        changed = true;
      }
      if (next.status === ("Healthy" as unknown) || next.status === ("Paused" as unknown)) {
        next.status = next.status === ("Paused" as unknown) ? "paused" : "active";
        changed = true;
      }
      if (next.description === undefined) {
        next.description = "";
        changed = true;
      }
      if (!next.environment) {
        next.environment = "production";
        changed = true;
      }
      if (!next.workspaceId) {
        next.workspaceId = "ws_seed";
        changed = true;
      }
      if (!next.secretHash) {
        next.secretHash = next.secretKey ? next.secretKey : "";
        changed = true;
      }
      if (!next.updatedAt) {
        next.updatedAt = next.createdAt ?? Date.now();
        changed = true;
      }
      return next;
    });
    parsed.logs = (parsed.logs ?? []).map((l) => {
      const next = { ...l } as LogEntry;
      if (!next.workspaceId) {
        next.workspaceId = "ws_seed";
        changed = true;
      }
      if (next.agentId === undefined) {
        next.agentId = null;
        changed = true;
      }
      if (next.userId === undefined) {
        next.userId = null;
        changed = true;
      }
      if (next.apiKeyId === undefined) {
        next.apiKeyId = null;
        changed = true;
      }
      if (!next.resource) {
        next.resource = "platform";
        changed = true;
      }
      if (!next.responseCode) {
        next.responseCode = next.result === "Blocked" ? 403 : 200;
        changed = true;
      }
      if (!next.userAgent) {
        next.userAgent = USER_AGENT;
        changed = true;
      }
      return next;
    });
    if (changed) saveDB(parsed);
    return parsed;
  } catch {
    return seed();
  }
}

export function exportLogsCsv(logs: LogEntry[]): string {
  const header = ["id", "timestamp", "agent_id", "agent", "action", "resource", "status", "response_code", "latency_ms", "ip_address", "request_id", "reason"];
  const rows = logs.map((l) =>
    [
      l.id,
      new Date(l.time).toISOString(),
      l.agentId ?? "",
      l.agent,
      l.action,
      l.resource,
      l.result.toLowerCase(),
      l.responseCode,
      l.latencyMs,
      l.ip,
      l.requestId,
      l.reason ?? "",
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function exportLogsJson(logs: LogEntry[]): string {
  return JSON.stringify(
    logs.map((l) => ({
      id: l.id,
      timestamp: new Date(l.time).toISOString(),
      workspace_id: l.workspaceId,
      agent_id: l.agentId,
      action: l.action,
      resource: l.resource,
      status: l.result.toLowerCase(),
      response_code: l.responseCode,
      latency_ms: l.latencyMs,
      ip_address: l.ip,
      request_id: l.requestId,
      reason: l.reason,
    })),
    null,
    2,
  );
}

export function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function log(
  db: DB,
  agent: string,
  action: string,
  result: LogEntry["result"],
  opts?: {
    agentId?: string | null;
    resource?: string;
    responseCode?: number;
    reason?: string;
    apiKeyId?: string | null;
    userId?: string | null;
  },
): DB {
  const entry: LogEntry = {
    id: uid("log"),
    time: Date.now(),
    workspaceId: getCurrentWorkspace()?.id ?? "ws_seed",
    agentId: opts?.agentId ?? db.agents.find((a) => a.name === agent)?.id ?? null,
    agent,
    userId: opts?.userId ?? null,
    apiKeyId: opts?.apiKeyId ?? null,
    action,
    resource: opts?.resource ?? "platform",
    result,
    responseCode: opts?.responseCode ?? (result === "Blocked" ? 403 : 200),
    reason: opts?.reason,
    latencyMs: result === "Blocked" ? Math.floor(20 + Math.random() * 40) : randomLatency(),
    ip: randomIp(),
    userAgent: USER_AGENT,
    requestId: uid("req"),
  };
  return { ...db, logs: [entry, ...db.logs].slice(0, 200) };
}

export function toPublic(a: Agent): AgentPublic {
  return {
    id: a.id,
    name: a.name,
    owner: a.owner,
    status: a.status,
    public_key: a.publicKey,
    fingerprint: a.fingerprint,
    created_at: new Date(a.createdAt).toISOString(),
  };
}

// ---- Agent API ----
// POST /agents
export function createAgent(
  db: DB,
  input: { name: string; description?: string; environment?: Environment; model?: string; capabilities?: Capability[] },
): { db: DB; agent: Agent } {
  const now = Date.now();
  const keys = makeKeys();
  const agent: Agent = {
    id: uid("ag"),
    workspaceId: getCurrentWorkspace()?.id ?? "ws_seed",
    uuid: uuidv4(),
    name: input.name,
    description: input.description ?? "",
    environment: input.environment ?? "development",
    owner: getSession()?.org ?? "Acme Inc.",
    model: input.model ?? "gpt-5",
    status: "active",
    ...keys,
    capabilities: input.capabilities ?? [],
    policies: {},
    createdAt: now,
    updatedAt: now,
    lastActivity: now,
  };
  let next: DB = { ...db, agents: [agent, ...db.agents] };
  next = log(next, agent.name, "POST /agents", "Success");
  return { db: next, agent };
}

// PATCH /agents
export function updateAgent(db: DB, id: string, patch: Partial<Agent>): DB {
  const next = {
    ...db,
    agents: db.agents.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a)),
  };
  const a = next.agents.find((x) => x.id === id);
  return a ? log(next, a.name, "PATCH /agents", "Success") : next;
}

// DELETE /agents
export function deleteAgent(db: DB, id: string): DB {
  const a = db.agents.find((x) => x.id === id);
  const next = { ...db, agents: db.agents.filter((x) => x.id !== id) };
  return a ? log(next, a.name, "DELETE /agents", "Success") : next;
}

// POST /verify — lenient lookup used by the demo/playground
export function verifyAgent(db: DB, idOrKey: string): { verified: boolean; agent?: AgentPublic } {
  const a = db.agents.find(
    (x) => x.id === idOrKey || x.publicKey === idOrKey || x.fingerprint === idOrKey || x.uuid === idOrKey,
  );
  if (a && a.status === "active") return { verified: true, agent: toPublic(a) };
  return { verified: false };
}

export type VerifyErrorCode =
  | "INVALID_TOKEN"
  | "TOKEN_REVOKED"
  | "AGENT_NOT_FOUND"
  | "AGENT_DISABLED"
  | "PERMISSION_DENIED"
  | "WORKSPACE_DISABLED";

export type VerifyResult =
  | {
      verified: true;
      agent: { id: string; name: string; status: string };
      permissions: string[];
      verified_at: string;
    }
  | {
      verified: false;
      error: { code: VerifyErrorCode; message: string };
    };

const VERIFY_MESSAGES: Record<VerifyErrorCode, string> = {
  INVALID_TOKEN: "The provided API token is invalid.",
  TOKEN_REVOKED: "The API token has been revoked.",
  AGENT_NOT_FOUND: "Agent does not exist.",
  AGENT_DISABLED: "Agent is inactive.",
  PERMISSION_DENIED: "Required permission is missing.",
  WORKSPACE_DISABLED: "Workspace is inactive.",
};

function permissionApiKeys(agent: Agent): string[] {
  // map internal policy keys (gmail:read) to API-style (email.read)
  const map: Record<string, string> = {
    "gmail:read": "email.read",
    "gmail:send": "email.send",
    "gmail:delete": "email.delete",
    "calendar:read": "calendar.read",
    "calendar:write": "calendar.write",
    "crm:read": "crm.read",
    "crm:write": "crm.write",
    "crm:export": "crm.export",
    "stripe:read": "payments.read",
    "stripe:transfer": "payments.transfer",
  };
  return Object.entries(agent.policies)
    .filter(([, allowed]) => allowed)
    .map(([k]) => map[k] ?? k);
}

// Full verification per the Verification API spec.
// POST /v1/verify  { agent_id, token, require? }
export function verify(
  db: DB,
  input: { agentId: string; token?: string; require?: string },
): { result: VerifyResult; db: DB } {
  const fail = (code: VerifyErrorCode): { result: VerifyResult; db: DB } => {
    const next = log(db, input.agentId || "unknown", "POST /v1/verify", "Blocked", {
      resource: "verify",
      responseCode: code === "INVALID_TOKEN" || code === "TOKEN_REVOKED" ? 401 : 403,
      reason: code,
      agentId: input.agentId || null,
    });
    return { result: { verified: false, error: { code, message: VERIFY_MESSAGES[code] } }, db: next };
  };

  // Workspace active?
  if (!getCurrentWorkspace() && getSession() === null) {
    return fail("WORKSPACE_DISABLED");
  }

  const agent = db.agents.find((a) => a.id === input.agentId);
  if (!agent) return fail("AGENT_NOT_FOUND");
  if (agent.status !== "active") return fail("AGENT_DISABLED");

  // Token validation: accept the agent's secret, or a valid (non-revoked) workspace API key.
  if (input.token) {
    const matchesAgent = input.token === agent.secretKey || hashPassword(input.token) === agent.secretHash;
    const apiKey = db.apiKeys.find((k) => k.token === input.token);
    if (apiKey && apiKey.revokedAt) return fail("TOKEN_REVOKED");
    const matchesKey = Boolean(apiKey) && !apiKey?.revokedAt;
    if (!matchesAgent && !matchesKey) return fail("INVALID_TOKEN");
  }

  const permissions = permissionApiKeys(agent);
  if (input.require && !permissions.includes(input.require)) {
    return fail("PERMISSION_DENIED");
  }

  const next = log(db, agent.name, "POST /v1/verify", "Success", {
    resource: "verify",
    responseCode: 200,
    agentId: agent.id,
  });

  return {
    result: {
      verified: true,
      agent: { id: agent.id, name: agent.name, status: agent.status === "active" ? "healthy" : agent.status },
      permissions,
      verified_at: new Date().toISOString(),
    },
    db: next,
  };
}

export function rotateAgentKeys(db: DB, id: string): DB {
  const keys = makeKeys();
  const next = { ...db, agents: db.agents.map((a) => (a.id === id ? { ...a, ...keys } : a)) };
  const a = next.agents.find((x) => x.id === id);
  return a ? log(next, a.name, "Rotated agent keys", "Success") : next;
}

export function setPolicy(db: DB, id: string, policy: string, allowed: boolean): DB {
  const next = {
    ...db,
    agents: db.agents.map((a) => (a.id === id ? { ...a, policies: { ...a.policies, [policy]: allowed } } : a)),
  };
  const a = next.agents.find((x) => x.id === id);
  const def = PERMISSION_CATALOG.find((p) => p.key === policy);
  const label = def ? def.label : policy;
  return a ? log(next, a.name, `${allowed ? "Granted" : "Denied"}: ${label}`, "Success") : next;
}

// ---- API keys ----
// POST /v1/api-keys
export function createKey(
  db: DB,
  input: { name: string; environment: Environment; permissions: KeyPermission },
): { db: DB; key: ApiKey } {
  const secret = makeApiSecret(input.environment);
  const key: ApiKey = {
    id: uid("key"),
    workspaceId: getCurrentWorkspace()?.id ?? "ws_seed",
    name: input.name,
    environment: input.environment,
    ...secret,
    permissions: input.permissions,
    lastUsedAt: null,
    createdAt: Date.now(),
    revokedAt: null,
  };
  const next = log({ ...db, apiKeys: [key, ...db.apiKeys] }, "System", `API key created: ${input.name}`, "Success");
  return { db: next, key };
}

// DELETE /v1/api-keys/{id}
export function revokeKey(db: DB, id: string): DB {
  const k = db.apiKeys.find((x) => x.id === id);
  const next = { ...db, apiKeys: db.apiKeys.filter((x) => x.id !== id) };
  return k ? log(next, "System", `API key revoked: ${k.name}`, "Success") : next;
}

// POST /v1/api-keys/{id}/rotate
export function rotateKey(db: DB, id: string): { db: DB; key?: ApiKey } {
  const existing = db.apiKeys.find((x) => x.id === id);
  if (!existing) return { db };
  const secret = makeApiSecret(existing.environment);
  const rotated: ApiKey = { ...existing, ...secret, createdAt: Date.now(), lastUsedAt: null, revokedAt: null };
  const next = log(
    { ...db, apiKeys: db.apiKeys.map((k) => (k.id === id ? rotated : k)) },
    "System",
    `API key rotated: ${existing.name}`,
    "Success",
  );
  return { db: next, key: rotated };
}

export function keyPublic(k: ApiKey) {
  return {
    id: k.id,
    name: k.name,
    environment: k.environment,
    prefix: k.keyPrefix,
    created_at: new Date(k.createdAt).toISOString(),
  };
}

// ---- Auth (mock JWT) ----
export function makeJwt(session: Session): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: session.email, org: session.org, iat: Math.floor(Date.now() / 1000) }));
  const sig = btoa(rand(24)).replace(/=/g, "");
  return `${header}.${payload}.${sig}`;
}

const USERS_KEY = "machinarc_users";
const WORKSPACES_KEY = "machinarc_workspaces";

// naive hash for demo only — never use in production
function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (h << 5) - h + pw.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h).toString(36)}`;
}

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as User[];
  } catch {
    return [];
  }
}
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadWorkspaces(): Workspace[] {
  try {
    return JSON.parse(localStorage.getItem(WORKSPACES_KEY) ?? "[]") as Workspace[];
  } catch {
    return [];
  }
}
function saveWorkspaces(ws: Workspace[]) {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(ws));
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentWorkspace(): Workspace | null {
  const session = getSession();
  if (!session) return null;
  return loadWorkspaces().find((w) => w.name === session.org) ?? null;
}

// Sign up: create user + workspace, then start a session.
export function register(email: string, password: string, workspaceName: string): { ok: boolean; error?: string; session?: Session } {
  const cleanedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  if (users.some((u) => u.email === cleanedEmail)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const now = Date.now();
  const user: User = {
    id: uid("user"),
    email: cleanedEmail,
    password_hash: hashPassword(password),
    created_at: now,
    updated_at: now,
  };
  saveUsers([...users, user]);

  const ws: Workspace = {
    id: uid("ws"),
    name: workspaceName.trim(),
    owner_id: user.id,
    created_at: now,
    updated_at: now,
  };
  saveWorkspaces([...loadWorkspaces(), ws]);

  const session: Session = { email: cleanedEmail, org: ws.name };
  saveSession(session);
  return { ok: true, session };
}

// Login: verify credentials against stored users.
export function login(email: string, password: string): { ok: boolean; error?: string; session?: Session } {
  const cleanedEmail = email.trim().toLowerCase();
  const user = loadUsers().find((u) => u.email === cleanedEmail);
  if (!user || user.password_hash !== hashPassword(password)) {
    return { ok: false, error: "Invalid email or password." };
  }
  const ws = loadWorkspaces().find((w) => w.owner_id === user.id);
  const session: Session = { email: cleanedEmail, org: ws?.name ?? "Workspace" };
  saveSession(session);
  return { ok: true, session };
}

// Continue with Google — finds or provisions an account + workspace (demo OAuth).
export function continueWithGoogle(email: string): { ok: boolean; session?: Session } {
  const cleanedEmail = email.trim().toLowerCase();
  if (!cleanedEmail) return { ok: false };
  const users = loadUsers();
  let user = users.find((u) => u.email === cleanedEmail);
  const now = Date.now();

  if (!user) {
    user = {
      id: uid("user"),
      email: cleanedEmail,
      password_hash: hashPassword(`google_${rand(16)}`),
      created_at: now,
      updated_at: now,
    };
    saveUsers([...users, user]);
  }

  let ws = loadWorkspaces().find((w) => w.owner_id === user!.id);
  if (!ws) {
    const handle = cleanedEmail.split("@")[1]?.split(".")[0] ?? "My";
    ws = {
      id: uid("ws"),
      name: `${handle.charAt(0).toUpperCase()}${handle.slice(1)} Workspace`,
      owner_id: user.id,
      created_at: now,
      updated_at: now,
    };
    saveWorkspaces([...loadWorkspaces(), ws]);
  }

  const session: Session = { email: cleanedEmail, org: ws.name };
  saveSession(session);
  return { ok: true, session };
}

// Password reset — sets a new password for an existing account.
export function resetPassword(email: string, newPassword: string): { ok: boolean; error?: string } {
  const cleanedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find((u) => u.email === cleanedEmail);
  if (!user) {
    return { ok: false, error: "No account found with that email." };
  }
  if (newPassword.trim().length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }
  user.password_hash = hashPassword(newPassword);
  user.updated_at = Date.now();
  saveUsers(users);
  return { ok: true };
}

export function renameWorkspace(name: string): Session | null {
  const session = getSession();
  if (!session || !name.trim()) return session;
  const ws = loadWorkspaces();
  const current = ws.find((w) => w.name === session.org);
  if (current) {
    current.name = name.trim();
    current.updated_at = Date.now();
    saveWorkspaces(ws);
  }
  const next: Session = { ...session, org: name.trim() };
  saveSession(next);
  return next;
}

export function signOut() {
  saveSession(null);
}

export function relativeTime(ts: number | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export type { DB };
