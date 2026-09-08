import api from "./api";

export type UserRole = "ROLE_ADMIN" | "ROLE_RESPONSABLE_PROJET" | "ROLE_UTILISATEUR_SIMPLE";

export interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  derniereConnexion: string;
}

export interface CreateUtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  motDePasse: string;
}

export interface UpdateUtilisateurRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  role?: UserRole;
  motDePasse?: string;
}

type ApiUser = {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  dateDerniereConnexion: string | null;
  role: string;
};

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ROLE_ADMIN" ||
    value === "ROLE_RESPONSABLE_PROJET" ||
    value === "ROLE_UTILISATEUR_SIMPLE"
  );
}

function normalizeUser(user: ApiUser): AppUser {
  return {
    id: String(user.idUtilisateur),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: isUserRole(user.role) ? user.role : "ROLE_UTILISATEUR_SIMPLE",
    derniereConnexion: user.dateDerniereConnexion ?? "",
  };
}

function extractUsers(payload: unknown): ApiUser[] {
  if (Array.isArray(payload)) {
    return payload as ApiUser[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ApiUser[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "content" in payload &&
    Array.isArray((payload as { content?: unknown }).content)
  ) {
    return (payload as { content: ApiUser[] }).content;
  }

  return [];
}

export async function getUsers() {
  const response = await api.get("/utilisateurs");
  return extractUsers(response.data).map(normalizeUser);
}

export async function createUser(payload: CreateUtilisateurRequest) {
  const response = await api.post("/utilisateurs", payload);
  return normalizeUser(response.data as ApiUser);
}

export async function updateUser(userId: string, payload: UpdateUtilisateurRequest) {
  const response = await api.put(`/utilisateurs/${userId}`, payload);
  return normalizeUser(response.data as ApiUser);
}

export async function deleteUser(userId: string) {
  await api.delete(`/utilisateurs/${userId}`);
}
