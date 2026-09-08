import axios from "axios";
import api from "./api";

export interface DashboardKpisResponse {
  totalProjects: number;
  plannedProjects: number;
  projectsInProgress: number;
  completedProjects: number;
  delayedProjects: number;
  totalPlannedBudget: number;
  totalConsumedCost: number;
  globalBudgetVariance: number;
  criticalRisks: number;
}

export interface DashboardCountItemResponse {
  key: string;
  count: number;
}

export interface DashboardBudgetProjectResponse {
  projectId: number;
  code: string;
  intitule: string;
  plannedBudget: number;
  consumedCost: number;
  variance: number;
}

export type DashboardAttentionReason = "DELAYED" | "BUDGET_OVERRUN" | "CRITICAL_RISK";

export type DashboardProjectStatus =
  "PLANIFIE" | "EN_COURS" | "TERMINE" | "EN_RETARD" | "SUSPENDU" | "ANNULE";

export type DashboardProjectPriority = "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";

export interface DashboardAttentionProjectResponse {
  projectId: number;
  code: string;
  intitule: string;
  statut: DashboardProjectStatus;
  priorite: DashboardProjectPriority;
  pourcentageAvancement: number;
  dateFinPrevue: string;
  plannedBudget: number;
  consumedCost: number;
  budgetVariance: number;
  criticalRiskCount: number;
  reasons: DashboardAttentionReason[];
}

export interface DashboardResponse {
  kpis: DashboardKpisResponse;
  projectsByStatus: DashboardCountItemResponse[];
  projectsByPriority: DashboardCountItemResponse[];
  budgetVsConsumedByProject: DashboardBudgetProjectResponse[];
  risksByCriticality: DashboardCountItemResponse[];
  projectsRequiringAttention: DashboardAttentionProjectResponse[];
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

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>("/dashboard");
  return response.data;
}

export function getDashboardErrorMessage(error: unknown, fallback: string) {
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
    return "Vous n'etes pas autorise a consulter le tableau de bord.";
  }

  return fallback;
}
