import axios from "axios";
import api from "./api";
import type {
  AffectationRessource,
  CreateAffectationRessourceRequest,
  NatureIntervention,
  UpdateAffectationRessourceRequest,
} from "@/types/affectationRessource";

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
    return Number.NaN;
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

  return Number.NaN;
}

function readRequiredString(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readString(record, keys);

  if (!value) {
    throw new Error(`Champ affectation ressource invalide ou manquant: ${field}`);
  }

  return value;
}

function readRequiredNumber(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readNumber(record, keys);

  if (!Number.isFinite(value)) {
    throw new Error(`Champ affectation ressource invalide ou manquant: ${field}`);
  }

  return value;
}

function isNatureIntervention(value: unknown): value is NatureIntervention {
  return (
    value === "DEVELOPPEMENT" ||
    value === "TEST" ||
    value === "CONCEPTION" ||
    value === "GESTION_PROJET" ||
    value === "SUPPORT" ||
    value === "MAINTENANCE" ||
    value === "AUTRE"
  );
}

function normalizeNatureIntervention(value: unknown): NatureIntervention {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (isNatureIntervention(normalized)) {
    return normalized;
  }

  throw new Error(`Nature d'intervention invalide: ${String(value ?? "")}`);
}

function extractPayload(payload: unknown) {
  const record = toRecord(payload);

  if (record && "data" in record) {
    return record.data;
  }

  return payload;
}

function extractAffectations(payload: unknown): unknown[] {
  const data = extractPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function normalizeAffectation(value: unknown): AffectationRessource {
  const record = toRecord(value);

  return {
    idAffectationRessource: readRequiredNumber(
      record,
      ["idAffectationRessource"],
      "idAffectationRessource",
    ),
    natureIntervention: normalizeNatureIntervention(
      readRequiredString(record, ["natureIntervention"], "natureIntervention"),
    ),
    chargeJH: readRequiredNumber(record, ["chargeJH"], "chargeJH"),
    idProjet: readRequiredNumber(record, ["idProjet"], "idProjet"),
    codeProjet: readRequiredString(record, ["codeProjet"], "codeProjet"),
    intituleProjet: readRequiredString(record, ["intituleProjet"], "intituleProjet"),
    idRessource: readRequiredNumber(record, ["idRessource"], "idRessource"),
    nomRessource: readRequiredString(record, ["nomRessource"], "nomRessource"),
    fonctionRessource: readRequiredString(record, ["fonctionRessource"], "fonctionRessource"),
    natureRessource: readRequiredString(record, ["natureRessource"], "natureRessource"),
  };
}

function buildCreatePayload(
  projectId: number,
  request: CreateAffectationRessourceRequest,
): CreateAffectationRessourceRequest {
  if (request.idProjet !== projectId) {
    throw new Error("Le projet du chemin doit correspondre au projet de la requete");
  }

  return {
    idProjet: projectId,
    idRessource: request.idRessource,
    natureIntervention: request.natureIntervention,
    chargeJH: request.chargeJH,
  };
}

function buildUpdatePayload(
  request: UpdateAffectationRessourceRequest,
): UpdateAffectationRessourceRequest {
  return {
    natureIntervention: request.natureIntervention,
    chargeJH: request.chargeJH,
  };
}

export async function getAffectationsByProjet(projectId: number): Promise<AffectationRessource[]> {
  const response = await api.get(`/projets/${projectId}/affectations-ressources`);
  return extractAffectations(response.data).map(normalizeAffectation);
}

export async function getAffectationsByRessource(
  ressourceId: number,
): Promise<AffectationRessource[]> {
  const response = await api.get(`/ressources/${ressourceId}/affectations`);
  return extractAffectations(response.data).map(normalizeAffectation);
}

export async function createAffectation(
  projectId: number,
  request: CreateAffectationRessourceRequest,
): Promise<AffectationRessource> {
  const response = await api.post(
    `/projets/${projectId}/affectations-ressources`,
    buildCreatePayload(projectId, request),
  );

  return normalizeAffectation(extractPayload(response.data));
}

export async function updateAffectation(
  projectId: number,
  affectationId: number,
  request: UpdateAffectationRessourceRequest,
): Promise<AffectationRessource> {
  const response = await api.put(
    `/projets/${projectId}/affectations-ressources/${affectationId}`,
    buildUpdatePayload(request),
  );

  return normalizeAffectation(extractPayload(response.data));
}

export async function deleteAffectation(projectId: number, affectationId: number): Promise<void> {
  await api.delete(`/projets/${projectId}/affectations-ressources/${affectationId}`);
}

export function getAffectationRessourceErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
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
    return "Acces refuse.";
  }

  if (error.response?.status === 404) {
    return "Projet, ressource ou affectation introuvable.";
  }

  if (error.response?.status === 400) {
    return "La demande d'affectation est invalide.";
  }

  return fallback;
}
