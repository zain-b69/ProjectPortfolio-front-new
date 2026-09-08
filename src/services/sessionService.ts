export type UserRole = "ROLE_ADMIN" | "ROLE_RESPONSABLE_PROJET" | "ROLE_UTILISATEUR_SIMPLE";

export interface SessionUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
}

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "currentUser";

function isBrowser() {
  return typeof window !== "undefined";
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ROLE_ADMIN" ||
    value === "ROLE_RESPONSABLE_PROJET" ||
    value === "ROLE_UTILISATEUR_SIMPLE"
  );
}

function normalizeRole(value: unknown): UserRole {
  return isUserRole(value) ? value : "ROLE_UTILISATEUR_SIMPLE";
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function readRole(record: Record<string, unknown> | null, keys: string[]) {
  const rawRole = readString(record, keys);

  if (isUserRole(rawRole)) {
    return rawRole;
  }

  const roleArrays = [
    record?.roles,
    record?.roleNames,
    toRecord(record?.realm_access)?.roles,
    toRecord(record?.resource_access)?.roles,
  ];

  for (const roleArray of roleArrays) {
    if (!Array.isArray(roleArray)) {
      continue;
    }

    for (const role of roleArray) {
      if (typeof role === "string" && isUserRole(role)) {
        return role;
      }
    }
  }

  const authorities = record?.authorities;
  if (Array.isArray(authorities)) {
    for (const authority of authorities) {
      if (typeof authority === "string" && isUserRole(authority)) {
        return authority;
      }

      if (
        authority &&
        typeof authority === "object" &&
        "authority" in authority &&
        isUserRole((authority as { authority?: unknown }).authority)
      ) {
        return (authority as { authority: UserRole }).authority;
      }
    }
  }

  return "ROLE_UTILISATEUR_SIMPLE";
}

function extractUserFromSource(source: unknown): SessionUser | null {
  const record = toRecord(source);

  if (!record) {
    return null;
  }

  const id = readString(record, ["id", "idUtilisateur", "userId", "sub"]);
  const nom = readString(record, ["nom", "lastName", "family_name", "familyName"]);
  const prenom = readString(record, ["prenom", "firstName", "given_name", "givenName"]);
  const email = readString(record, ["email", "username", "sub"]);
  const role = readRole(record, ["role", "profil", "scope", "authorities", "roles"]);

  if (!email && !id) {
    return null;
  }

  return {
    id,
    nom,
    prenom,
    email,
    role: normalizeRole(role),
  };
}

function extractUserFromAuthPayload(payload: unknown): SessionUser | null {
  const record = toRecord(payload);

  if (!record) {
    return null;
  }

  return (
    extractUserFromSource(record.user) ??
    extractUserFromSource(record.utilisateur) ??
    extractUserFromSource(record.currentUser) ??
    extractUserFromSource(record.profile) ??
    extractUserFromSource(record)
  );
}

function extractToken(payload: unknown) {
  const record = toRecord(payload);

  if (!record) {
    return "";
  }

  return readString(record, ["token", "accessToken", "jwt", "access_token"]);
}

export function persistAuthSession(payload: unknown) {
  if (!isBrowser()) {
    return null;
  }

  const token = extractToken(payload);

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  const userFromPayload = extractUserFromAuthPayload(payload);
  const userFromToken = token ? extractUserFromSource(decodeJwtPayload(token)) : null;
  const user = userFromPayload ?? userFromToken;

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  return user;
}

export function getStoredToken() {
  if (!isBrowser()) {
    return "";
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) {
    return null;
  }

  const serializedUser = window.localStorage.getItem(USER_STORAGE_KEY);

  if (serializedUser) {
    try {
      return extractUserFromSource(JSON.parse(serializedUser));
    } catch {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  const token = getStoredToken();

  if (!token) {
    return null;
  }

  const user = extractUserFromSource(decodeJwtPayload(token));

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  return user;
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function isProjectManager(user: SessionUser | null) {
  return user?.role === "ROLE_RESPONSABLE_PROJET";
}

export function formatRoleLabel(role: UserRole | "") {
  switch (role) {
    case "ROLE_ADMIN":
      return "Administrateur";
    case "ROLE_RESPONSABLE_PROJET":
      return "Responsable projet";
    case "ROLE_UTILISATEUR_SIMPLE":
      return "Utilisateur";
    default:
      return "";
  }
}

export function getUserInitials(user: SessionUser | null) {
  if (!user) {
    return "??";
  }

  return `${user.prenom?.[0] ?? "?"}${user.nom?.[0] ?? "?"}`;
}
