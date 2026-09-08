import axios from "axios";
import api from "./api";

export type TypeAction =
  | "CREATION"
  | "MODIFICATION"
  | "SUPPRESSION"
  | "CONNEXION"
  | "AJOUT_COUT"
  | "AJOUT_RISQUE"
  | "AJOUT_PIECE_JOINTE"
  | "AFFECTATION_RESSOURCE";

export interface HistoriqueModificationResponse {
  idHistoriqueModification: number;
  dateModification: string;
  typeAction: TypeAction | null;
  description: string | null;
  idUtilisateur: number | null;
  nomUtilisateur: string | null;
  prenomUtilisateur: string | null;
  emailUtilisateur: string | null;
  nomCompletUtilisateur: string | null;
  idProjet: number | null;
  codeProjet: string | null;
  intituleProjet: string | null;
}

export interface HistoriquePageResponse {
  content: HistoriqueModificationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface HistoriqueFilters {
  search?: string;
  typeAction?: string;
  projetId?: string;
  utilisateurId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const typeActionOptions: Array<{ value: TypeAction; label: string }> = [
  { value: "CREATION", label: "Création" },
  { value: "MODIFICATION", label: "Modification" },
  { value: "SUPPRESSION", label: "Suppression" },
  { value: "CONNEXION", label: "Connexion" },
  { value: "AJOUT_COUT", label: "Ajout coût" },
  { value: "AJOUT_RISQUE", label: "Ajout risque" },
  { value: "AJOUT_PIECE_JOINTE", label: "Ajout pièce jointe" },
  { value: "AFFECTATION_RESSOURCE", label: "Affectation ressource" },
];

const typeActionLabelMap = new Map(typeActionOptions.map((option) => [option.value, option.label]));

export function formatTypeAction(typeAction: TypeAction | null | undefined) {
  if (!typeAction) {
    return "—";
  }
  return typeActionLabelMap.get(typeAction) ?? typeAction;
}

export function formatHistoriqueDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addParam(params: Record<string, string>, key: string, value: string | undefined) {
  const normalized = value?.trim();
  if (normalized) {
    params[key] = normalized;
  }
}

function buildHistoriqueParams(filters: HistoriqueFilters, page: number, size: number) {
  const params: Record<string, string> = {
    page: String(Math.max(page, 0)),
    size: String(size),
  };

  addParam(params, "search", filters.search);

  if (filters.typeAction && filters.typeAction !== "all") {
    params.typeAction = filters.typeAction;
  }

  addParam(params, "projetId", filters.projetId);
  addParam(params, "utilisateurId", filters.utilisateurId);
  addParam(params, "dateFrom", filters.dateFrom);
  addParam(params, "dateTo", filters.dateTo);

  return params;
}

export async function getHistorique(
  filters: HistoriqueFilters = {},
  page = 0,
  size = 20,
): Promise<HistoriquePageResponse> {
  const response = await api.get<HistoriquePageResponse>("/historique", {
    params: buildHistoriqueParams(filters, page, size),
  });
  return response.data;
}

export async function getProjectHistorique(
  projectId: number,
): Promise<HistoriqueModificationResponse[]> {
  const response = await api.get<HistoriqueModificationResponse[]>(
    `/projets/${projectId}/historique`,
  );
  return response.data;
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
  }
  return "";
}

export function getHistoriqueErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = readString(toRecord(data), ["message", "error", "detail", "description"]);
    if (message) {
      return message;
    }
  }

  if (error.response?.status === 403) {
    return "Vous n'êtes pas autorisé à consulter l'historique.";
  }

  return fallback;
}
