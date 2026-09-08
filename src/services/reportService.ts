import axios from "axios";
import api from "./api";

export interface ReportKpisResponse {
  totalProjects: number;
  totalPlannedBudget: number;
  totalConsumedCost: number;
  totalBudgetVariance: number;
  averageProgress: number;
  totalCriticalRisks: number;
  totalResourceAllocations: number;
}

export interface ReportProjectRowResponse {
  projectId: number;
  code: string;
  intitule: string;
  responsable: string;
  statut: string;
  priorite: string;
  plannedBudget: number;
  consumedCost: number;
  variance: number;
  progress: number | null;
  criticalRiskCount: number;
  resourceCount: number;
}

export interface ReportCountItemResponse {
  key: string;
  count: number;
}

export interface ReportBudgetByStatusResponse {
  statut: string;
  totalPlannedBudget: number;
  projectCount: number;
}

export interface ReportCostByTypeResponse {
  type: string;
  totalMontant: number;
  count: number;
}

export interface ReportResourceAllocationResponse {
  natureIntervention: string;
  totalChargeJH: number;
  count: number;
}

export interface ReportSummaryResponse {
  kpis: ReportKpisResponse;
  projects: ReportProjectRowResponse[];
  projectsByStatus: ReportCountItemResponse[];
  projectsByPriority: ReportCountItemResponse[];
  budgetByStatus: ReportBudgetByStatusResponse[];
  costByType: ReportCostByTypeResponse[];
  resourceAllocationByNature: ReportResourceAllocationResponse[];
}

export async function getReport(): Promise<ReportSummaryResponse> {
  const response = await api.get<ReportSummaryResponse>("/rapports");
  return response.data;
}

function getFallbackExportFilename() {
  return `rapport_portefeuille_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

function extractFilenameFromContentDisposition(contentDisposition: string | undefined) {
  if (!contentDisposition) {
    return "";
  }
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? "";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportReportExcel(): Promise<string> {
  const response = await api.get<Blob>("/rapports/export", { responseType: "blob" });
  const filename =
    extractFilenameFromContentDisposition(response.headers["content-disposition"]) ||
    getFallbackExportFilename();
  downloadBlob(response.data, filename);
  return filename;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getReportErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const message = readString(toRecord(data), ["message", "error", "detail", "description"]);
    if (message) return message;
  }
  if (error.response?.status === 403) {
    return "Vous n'êtes pas autorisé à consulter les rapports.";
  }
  return fallback;
}
