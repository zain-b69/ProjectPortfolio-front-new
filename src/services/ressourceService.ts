import axios from "axios";
import api from "./api";
import type {
  CreateRessourceRequest,
  NatureRessource,
  Ressource,
  RessourceSearchParams,
  UpdateRessourceRequest,
} from "@/types/ressource";

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

function readNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return 0;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function readRequiredString(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readString(record, keys);

  if (!value) {
    throw new Error(`Champ ressource invalide ou manquant: ${field}`);
  }

  return value;
}

function readRequiredNumber(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readNumber(record, keys);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Champ ressource invalide ou manquant: ${field}`);
  }

  return value;
}

function isNatureRessource(value: unknown): value is NatureRessource {
  return value === "INTERNE" || value === "PRESTATAIRE";
}

function normalizeNatureRessource(value: unknown): NatureRessource {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (isNatureRessource(normalized)) {
    return normalized;
  }

  throw new Error(`Nature de ressource invalide: ${String(value ?? "")}`);
}

function extractPayload(payload: unknown) {
  const record = toRecord(payload);

  if (record && "data" in record) {
    return record.data;
  }

  return payload;
}

function extractRessources(payload: unknown): unknown[] {
  const data = extractPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const record = toRecord(data);

  if (record && Array.isArray(record.content)) {
    return record.content;
  }

  if (record && Array.isArray(record.ressources)) {
    return record.ressources;
  }

  return [];
}

function normalizeRessource(value: unknown): Ressource {
  const record = toRecord(value);

  return {
    idRessource: readRequiredNumber(record, ["idRessource", "id"], "idRessource"),
    nom: readRequiredString(record, ["nom", "nomRessource"], "nom"),
    fonction: readRequiredString(record, ["fonction", "role", "poste"], "fonction"),
    nature: normalizeNatureRessource(
      readRequiredString(record, ["nature", "natureRessource", "type"], "nature"),
    ),
  };
}

function buildSearchParams(params?: RessourceSearchParams) {
  const searchParams: Partial<Record<keyof RessourceSearchParams, string>> = {};

  if (params?.texte?.trim()) {
    searchParams.texte = params.texte.trim();
  }

  if (params?.nature) {
    searchParams.nature = params.nature;
  }

  return searchParams;
}

export async function getRessources(params?: RessourceSearchParams): Promise<Ressource[]> {
  const response = await api.get("/ressources", {
    params: buildSearchParams(params),
  });

  return extractRessources(response.data).map(normalizeRessource);
}

export async function createRessource(request: CreateRessourceRequest): Promise<Ressource> {
  const response = await api.post("/ressources", request);
  return normalizeRessource(extractPayload(response.data));
}

export async function updateRessource(
  idRessource: number,
  request: UpdateRessourceRequest,
): Promise<Ressource> {
  const response = await api.put(`/ressources/${idRessource}`, request);
  return normalizeRessource(extractPayload(response.data));
}

export async function deleteRessource(idRessource: number): Promise<void> {
  await api.delete(`/ressources/${idRessource}`);
}

export function getRessourceErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const message = readString(data as Record<string, unknown>, [
      "message",
      "error",
      "detail",
      "description",
    ]);

    if (message) {
      return message;
    }

    const fieldErrors = (data as { errors?: unknown }).errors;

    if (fieldErrors && typeof fieldErrors === "object") {
      const entries = Object.entries(fieldErrors as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([field, value]) => `${field}: ${String(value)}`);

      if (entries.length > 0) {
        return entries.join("\n");
      }
    }
  }

  if (error.response?.status === 403) {
    return "Vous n'etes pas autorise a effectuer cette action sur cette ressource.";
  }

  if (error.response?.status === 404) {
    return "Ressource introuvable.";
  }

  return fallback;
}
