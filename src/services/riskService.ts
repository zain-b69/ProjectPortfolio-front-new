import axios from "axios";
import api from "./api";

export type NiveauCriticite = "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";

export interface RisqueResponse {
  idRisque: number;
  description: string;
  niveauCriticite: NiveauCriticite;
  idProjet: number;
}

export interface RiskFormValues {
  description: string;
  niveauCriticite: NiveauCriticite;
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
    throw new Error(`Champ risque invalide ou manquant: ${field}`);
  }

  return value;
}

function readRequiredNumber(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readNumber(record, keys);

  if (!Number.isFinite(value)) {
    throw new Error(`Champ risque invalide ou manquant: ${field}`);
  }

  return value;
}

function isNiveauCriticite(value: unknown): value is NiveauCriticite {
  return value === "FAIBLE" || value === "MOYEN" || value === "ELEVE" || value === "CRITIQUE";
}

function normalizeNiveauCriticite(value: unknown): NiveauCriticite {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (isNiveauCriticite(normalized)) {
    return normalized;
  }

  throw new Error(`Niveau de criticite invalide: ${String(value ?? "")}`);
}

function extractPayload(payload: unknown) {
  const record = toRecord(payload);

  if (record && "data" in record) {
    return record.data;
  }

  return payload;
}

function extractRisks(payload: unknown): unknown[] {
  const data = extractPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const record = toRecord(data);

  if (record && Array.isArray(record.content)) {
    return record.content;
  }

  if (record && Array.isArray(record.risques)) {
    return record.risques;
  }

  return [];
}

function normalizeRisk(value: unknown): RisqueResponse {
  const record = toRecord(value);

  return {
    idRisque: readRequiredNumber(record, ["idRisque", "id"], "idRisque"),
    description: readRequiredString(record, ["description"], "description"),
    niveauCriticite: normalizeNiveauCriticite(
      readRequiredString(record, ["niveauCriticite", "criticite"], "niveauCriticite"),
    ),
    idProjet: readRequiredNumber(record, ["idProjet"], "idProjet"),
  };
}

function buildRiskPayload(values: RiskFormValues): RiskFormValues {
  return {
    description: values.description.trim(),
    niveauCriticite: values.niveauCriticite,
  };
}

export async function getProjectRisks(projectId: number): Promise<RisqueResponse[]> {
  const response = await api.get(`/projets/${projectId}/risques`);
  return extractRisks(response.data).map(normalizeRisk);
}

export async function createRisk(
  projectId: number,
  values: RiskFormValues,
): Promise<RisqueResponse> {
  const response = await api.post(`/projets/${projectId}/risques`, buildRiskPayload(values));
  return normalizeRisk(extractPayload(response.data));
}

export async function updateRisk(riskId: number, values: RiskFormValues): Promise<RisqueResponse> {
  const response = await api.put(`/risques/${riskId}`, buildRiskPayload(values));
  return normalizeRisk(extractPayload(response.data));
}

export async function deleteRisk(riskId: number): Promise<void> {
  await api.delete(`/risques/${riskId}`);
}

export function getRiskErrorMessage(error: unknown, fallback: string): string {
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
    return "Projet ou risque introuvable.";
  }

  if (error.response?.status === 400) {
    return "La demande de risque est invalide.";
  }

  return fallback;
}
