import axios from "axios";
import api from "./api";

export type TypeCout =
  "MATERIEL" | "LOGICIEL" | "PRESTATION" | "FORMATION" | "MAINTENANCE" | "AUTRE";

export interface CoutResponse {
  idCout: number;
  type: TypeCout;
  montant: number;
  dateCout: string;
  idProjet: number;
}

export interface CostFormValues {
  type: TypeCout;
  montant: string;
  dateCout: string;
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
    throw new Error(`Champ cout invalide ou manquant: ${field}`);
  }

  return value;
}

function readRequiredNumber(record: Record<string, unknown> | null, keys: string[], field: string) {
  const value = readNumber(record, keys);

  if (!Number.isFinite(value)) {
    throw new Error(`Champ cout invalide ou manquant: ${field}`);
  }

  return value;
}

function isTypeCout(value: unknown): value is TypeCout {
  return (
    value === "MATERIEL" ||
    value === "LOGICIEL" ||
    value === "PRESTATION" ||
    value === "FORMATION" ||
    value === "MAINTENANCE" ||
    value === "AUTRE"
  );
}

function normalizeTypeCout(value: unknown): TypeCout {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (isTypeCout(normalized)) {
    return normalized;
  }

  throw new Error(`Type de cout invalide: ${String(value ?? "")}`);
}

function extractPayload(payload: unknown) {
  const record = toRecord(payload);

  if (record && "data" in record) {
    return record.data;
  }

  return payload;
}

function extractCosts(payload: unknown): unknown[] {
  const data = extractPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const record = toRecord(data);

  if (record && Array.isArray(record.content)) {
    return record.content;
  }

  if (record && Array.isArray(record.couts)) {
    return record.couts;
  }

  return [];
}

function normalizeCost(value: unknown): CoutResponse {
  const record = toRecord(value);

  return {
    idCout: readRequiredNumber(record, ["idCout", "id"], "idCout"),
    type: normalizeTypeCout(readRequiredString(record, ["type", "typeCout"], "type")),
    montant: readRequiredNumber(record, ["montant"], "montant"),
    dateCout: readRequiredString(record, ["dateCout", "date"], "dateCout"),
    idProjet: readRequiredNumber(record, ["idProjet"], "idProjet"),
  };
}

function buildCostPayload(values: CostFormValues) {
  return {
    type: values.type,
    montant: Number(values.montant),
    dateCout: values.dateCout,
  };
}

export async function getProjectCosts(projectId: number): Promise<CoutResponse[]> {
  const response = await api.get(`/projets/${projectId}/couts`);
  return extractCosts(response.data).map(normalizeCost);
}

export async function createCost(projectId: number, values: CostFormValues): Promise<CoutResponse> {
  const response = await api.post(`/projets/${projectId}/couts`, buildCostPayload(values));
  return normalizeCost(extractPayload(response.data));
}

export async function updateCost(costId: number, values: CostFormValues): Promise<CoutResponse> {
  const response = await api.put(`/couts/${costId}`, buildCostPayload(values));
  return normalizeCost(extractPayload(response.data));
}

export async function deleteCost(costId: number): Promise<void> {
  await api.delete(`/couts/${costId}`);
}

export function getCostErrorMessage(error: unknown, fallback: string): string {
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
    return "Projet ou cout introuvable.";
  }

  if (error.response?.status === 400) {
    return "La demande de cout est invalide.";
  }

  return fallback;
}
