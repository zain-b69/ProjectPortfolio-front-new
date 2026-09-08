import axios from "axios";
import api from "./api";
import type { SessionUser } from "./sessionService";
export type ProjectStatus =
  "PLANIFIE" | "EN_COURS" | "TERMINE" | "EN_RETARD" | "SUSPENDU" | "ANNULE";
export type ProjectPriority = "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";
export type ProjectRiskLevel = "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";

export interface ProjectActor {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fullName: string;
}

export interface ProjectResource {
  id: string;
  nom: string;
  fonction: string;
  nature: string;
  chargeJH: number | null;
}

export interface ProjectRisk {
  id: string;
  description: string;
  criticite: string;
}

export interface ProjectAttachment {
  id: string;
  nomFichier: string;
  dateAjout: string;
}

export interface ProjectHistoryEntry {
  id: string;
  date: string;
  typeAction: string;
  description: string;
  utilisateur: string;
}

export interface ProjectCost {
  id: string;
  type: string;
  montant: number;
  date: string;
}

export interface Project {
  id: string;
  code: string;
  intitule: string;
  description: string;
  statut: ProjectStatus;
  priorite: ProjectPriority;
  niveauRisque: ProjectRiskLevel | null;
  budgetPrevisionnel: number;
  budgetConsomme: number;
  avancement: number;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle: string;
  dateFinReelle: string;
  responsable: ProjectActor | null;
  ressources: ProjectResource[];
  couts: ProjectCost[];
  risques: ProjectRisk[];
  piecesJointes: ProjectAttachment[];
  historique: ProjectHistoryEntry[];
}

export interface ProjectFormValues {
  code: string;
  intitule: string;
  descriptif: string;
  statut: ProjectStatus;
  priorite: ProjectPriority;
  budgetPrevisionnel: string;
  pourcentageAvancement: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle: string;
  dateFinReelle: string;
}

export interface ProjectFilters {
  search: string;
  statut: string;
  priorite: string;
  niveauRisque: string;
  responsable: string;
  ownership: "all" | "mine";
  code?: string;
  intitule?: string;
  responsableId?: string;
  responsableEmail?: string;
  dateDebutPrevueMin?: string;
  dateDebutPrevueMax?: string;
  dateFinPrevueMin?: string;
  dateFinPrevueMax?: string;
  budgetMin?: string;
  budgetMax?: string;
  avancementMin?: string;
  avancementMax?: string;
}

export const projectStatusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "PLANIFIE", label: "Planifie" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Termine" },
  { value: "EN_RETARD", label: "En retard" },
  { value: "SUSPENDU", label: "Suspendu" },
  { value: "ANNULE", label: "Annule" },
];

export const projectPriorityOptions: Array<{ value: ProjectPriority; label: string }> = [
  { value: "FAIBLE", label: "Basse" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "ELEVEE", label: "Haute" },
  { value: "CRITIQUE", label: "Critique" },
];

export const projectRiskOptions: Array<{ value: ProjectRiskLevel; label: string }> = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYEN", label: "Moyen" },
  { value: "ELEVE", label: "Eleve" },
  { value: "CRITIQUE", label: "Critique" },
];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return projectStatusOptions.some((option) => option.value === value);
}

export function isProjectPriority(value: unknown): value is ProjectPriority {
  return projectPriorityOptions.some((option) => option.value === value);
}

export function getProjectStatusValue(value: unknown): ProjectStatus {
  return normalizeProjectStatus(value);
}

export function getProjectPriorityValue(value: unknown): ProjectPriority {
  return normalizeProjectPriority(value);
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

function readArray(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeEnumToken(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

const projectStatusAliases = new Map<string, ProjectStatus>([
  ["PLANIFIE", "PLANIFIE"],
  ["PLANIFIED", "PLANIFIE"],
  ["EN_COURS", "EN_COURS"],
  ["ENCOURS", "EN_COURS"],
  ["IN_PROGRESS", "EN_COURS"],
  ["TERMINE", "TERMINE"],
  ["TERMINEE", "TERMINE"],
  ["COMPLETED", "TERMINE"],
  ["EN_RETARD", "EN_RETARD"],
  ["ENRETARD", "EN_RETARD"],
  ["RETARD", "EN_RETARD"],
  ["LATE", "EN_RETARD"],
  ["SUSPENDU", "SUSPENDU"],
  ["SUSPENDED", "SUSPENDU"],
  ["ANNULE", "ANNULE"],
  ["CANCELLED", "ANNULE"],
  ["CANCELED", "ANNULE"],
]);

const projectPriorityAliases = new Map<string, ProjectPriority>([
  ["BASSE", "FAIBLE"],
  ["FAIBLE", "FAIBLE"],
  ["LOW", "FAIBLE"],
  ["MOYENNE", "MOYENNE"],
  ["MOYEN", "MOYENNE"],
  ["MEDIUM", "MOYENNE"],
  ["ELEVEE", "ELEVEE"],
  ["ELEVE", "ELEVEE"],
  ["HAUTE", "ELEVEE"],
  ["HIGH", "ELEVEE"],
  ["CRITIQUE", "CRITIQUE"],
  ["CRITICAL", "CRITIQUE"],
]);

function normalizeProjectStatus(value: unknown): ProjectStatus {
  return projectStatusAliases.get(normalizeEnumToken(value)) ?? "PLANIFIE";
}

function canNormalizeProjectStatus(value: unknown) {
  return projectStatusAliases.has(normalizeEnumToken(value));
}

function normalizeProjectPriority(value: unknown): ProjectPriority {
  return projectPriorityAliases.get(normalizeEnumToken(value)) ?? "MOYENNE";
}

function canNormalizeProjectPriority(value: unknown) {
  return projectPriorityAliases.has(normalizeEnumToken(value));
}

function normalizeProjectRisk(value: unknown): ProjectRiskLevel | null {
  const raw = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!raw) {
    return null;
  }

  switch (raw) {
    case "FAIBLE":
    case "LOW":
      return "FAIBLE";
    case "MOYEN":
    case "MEDIUM":
      return "MOYEN";
    case "ELEVE":
    case "HAUT":
    case "HIGH":
      return "ELEVE";
    case "CRITIQUE":
    case "CRITICAL":
      return "CRITIQUE";
    default:
      return null;
  }
}

function normalizeActor(value: unknown): ProjectActor | null {
  const record = toRecord(value);

  if (!record) {
    return null;
  }

  const id = readString(record, ["id", "idUtilisateur", "idResponsable", "userId"]);
  const nom = readString(record, ["nom", "lastName"]);
  const prenom = readString(record, ["prenom", "firstName"]);
  const email = readString(record, ["email", "username"]);
  const fullName =
    readString(record, ["nomComplet", "fullName", "responsableNomComplet"]) ||
    `${prenom} ${nom}`.trim() ||
    email;

  if (!id && !email && !fullName) {
    return null;
  }

  return {
    id,
    nom,
    prenom,
    email,
    fullName,
  };
}

function normalizeFlatResponsable(record: Record<string, unknown> | null): ProjectActor | null {
  if (!record) {
    return null;
  }

  const id = readString(record, ["idResponsable"]);
  const nom = readString(record, ["nomResponsable"]);
  const prenom = readString(record, ["prenomResponsable"]);
  const email = readString(record, ["emailResponsable"]);
  const fullName = `${prenom} ${nom}`.trim() || email;

  if (!id && !nom && !prenom && !email) {
    return null;
  }

  return {
    id,
    nom,
    prenom,
    email,
    fullName,
  };
}

function normalizeResource(value: unknown): ProjectResource {
  const record = toRecord(value);

  return {
    id: readString(record, ["id", "idRessource", "idAffectation"]),
    nom:
      readString(record, ["nomComplet", "nomRessource", "nom"]) ||
      `${readString(record, ["prenom"])} ${readString(record, ["nom"])}`.trim(),
    fonction: readString(record, ["fonction", "role", "poste"]),
    nature: readString(record, ["nature", "natureIntervention", "type"]),
    chargeJH: record ? readNumber(record, ["chargeJH", "charge", "joursHommes"]) : null,
  };
}

function normalizeRisk(value: unknown): ProjectRisk {
  const record = toRecord(value);

  return {
    id: readString(record, ["id", "idRisque"]),
    description: readString(record, ["description", "libelle"]),
    criticite: readString(record, ["criticite", "niveauCriticite", "niveauRisque"]),
  };
}

function normalizeAttachment(value: unknown): ProjectAttachment {
  const record = toRecord(value);

  return {
    id: readString(record, ["id", "idPieceJointe"]),
    nomFichier: readString(record, ["nomFichier", "fileName", "nom"]),
    dateAjout: readString(record, ["dateAjout", "createdAt", "dateCreation"]),
  };
}

function normalizeHistoryEntry(value: unknown): ProjectHistoryEntry {
  const record = toRecord(value);

  return {
    id: readString(record, ["id", "idHistorique"]),
    date: readString(record, ["date", "dateAction", "createdAt"]),
    typeAction: readString(record, ["typeAction", "action", "operation"]),
    description: readString(record, ["description", "detail", "libelle"]),
    utilisateur:
      readString(record, ["utilisateur", "nomUtilisateur", "fullName"]) ||
      `${readString(record, ["prenom"])} ${readString(record, ["nom"])}`.trim(),
  };
}

function normalizeCost(value: unknown): ProjectCost {
  const record = toRecord(value);

  return {
    id: readString(record, ["id", "idCout"]),
    type: readString(record, ["type", "typeCout", "libelle"]),
    montant: readNumber(record, ["montant", "valeur"]),
    date: readString(record, ["date", "dateCout"]),
  };
}

function extractProjectPayload(payload: unknown) {
  const record = toRecord(payload);

  if (!record) {
    return payload;
  }

  if ("data" in record && record.data) {
    return record.data;
  }

  return payload;
}

function extractProjects(payload: unknown): unknown[] {
  const data = extractProjectPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const record = toRecord(data);

  if (record && Array.isArray(record.content)) {
    return record.content;
  }

  if (record && Array.isArray(record.projets)) {
    return record.projets;
  }

  return [];
}

function normalizeProject(value: unknown): Project {
  const record = toRecord(value);
  const responsable =
    normalizeFlatResponsable(record) ??
    normalizeActor(record?.responsableProjet) ??
    normalizeActor(record?.responsable) ??
    normalizeActor(record?.utilisateurResponsable) ??
    normalizeActor(record?.chefProjet) ??
    null;

  return {
    id: readString(record, ["id", "idProjet"]),
    code: readString(record, ["code", "codeProjet"]),
    intitule: readString(record, ["intitule", "nomProjet", "libelle"]),
    description: readString(record, ["description", "descriptif"]),
    statut: normalizeProjectStatus(
      readString(record, ["statut", "statutProjet", "etat", "status"]),
    ),
    priorite: normalizeProjectPriority(
      readString(record, ["priorite", "prioriteProjet", "niveauPriorite", "priority"]),
    ),
    niveauRisque: normalizeProjectRisk(
      readString(record, ["niveauRisque", "criticite", "riskLevel"]),
    ),
    budgetPrevisionnel: readNumber(record, ["budgetPrevisionnel", "budget"]),
    budgetConsomme: readNumber(record, ["budgetConsomme", "coutConsomme", "montantConsomme"]),
    avancement: readNumber(record, [
      "pourcentageAvancement",
      "avancement",
      "progression",
      "progress",
    ]),
    dateDebutPrevue: readString(record, ["dateDebutPrevue", "dateDebutPlanifiee"]),
    dateFinPrevue: readString(record, ["dateFinPrevue", "dateFinPlanifiee"]),
    dateDebutReelle: readString(record, ["dateDebutReelle", "dateDebutEffective"]),
    dateFinReelle: readString(record, ["dateFinReelle", "dateFinEffective"]),
    responsable,
    ressources: readArray(record, ["ressources", "affectations"]).map(normalizeResource),
    couts: readArray(record, ["couts", "costs"]).map(normalizeCost),
    risques: readArray(record, ["risques"]).map(normalizeRisk),
    piecesJointes: readArray(record, ["piecesJointes", "attachments"]).map(normalizeAttachment),
    historique: readArray(record, ["historique", "historiques"]).map(normalizeHistoryEntry),
  };
}

export function formatProjectStatus(status: ProjectStatus) {
  return projectStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function formatProjectPriority(priority: ProjectPriority) {
  return projectPriorityOptions.find((option) => option.value === priority)?.label ?? priority;
}

export function formatProjectRiskLevel(riskLevel: ProjectRiskLevel | null | undefined) {
  if (!riskLevel) {
    return "Aucun risque";
  }

  return projectRiskOptions.find((option) => option.value === riskLevel)?.label ?? riskLevel;
}

export function formatMad(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MAD`;
}

export function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}

export function getProjectFormValues(project?: Project | null): ProjectFormValues {
  return {
    code: project?.code ?? "",
    intitule: project?.intitule ?? "",
    descriptif: project?.description ?? "",
    statut: normalizeProjectStatus(project?.statut),
    priorite: normalizeProjectPriority(project?.priorite),
    budgetPrevisionnel:
      project && Number.isFinite(project.budgetPrevisionnel)
        ? String(project.budgetPrevisionnel)
        : "0",
    pourcentageAvancement:
      project && Number.isFinite(project.avancement) ? String(project.avancement) : "0",
    dateDebutPrevue: project?.dateDebutPrevue ?? "",
    dateFinPrevue: project?.dateFinPrevue ?? "",
    dateDebutReelle: project?.dateDebutReelle ?? "",
    dateFinReelle: project?.dateFinReelle ?? "",
  };
}

export function normalizeProjectFormValues(values: ProjectFormValues): ProjectFormValues {
  return {
    ...values,
    statut: normalizeProjectStatus(values.statut),
    priorite: normalizeProjectPriority(values.priorite),
  };
}

function isBeforeDate(start: string, end: string) {
  return Boolean(start && end && new Date(end).getTime() < new Date(start).getTime());
}

export function validateProjectForm(values: ProjectFormValues) {
  const errors: string[] = [];
  const budgetPrevisionnel = Number(values.budgetPrevisionnel);
  const pourcentageAvancement = Number(values.pourcentageAvancement);
  const statut = normalizeProjectStatus(values.statut);
  const priorite = normalizeProjectPriority(values.priorite);

  if (!values.code.trim()) {
    errors.push("Le code projet est obligatoire.");
  }

  if (!values.intitule.trim()) {
    errors.push("L'intitule du projet est obligatoire.");
  }

  if (!String(values.statut ?? "").trim() || !canNormalizeProjectStatus(values.statut)) {
    errors.push("Le statut du projet est obligatoire.");
  }

  if (!String(values.priorite ?? "").trim() || !canNormalizeProjectPriority(values.priorite)) {
    errors.push("La priorite du projet est obligatoire.");
  }

  if (!values.dateDebutPrevue || !values.dateFinPrevue) {
    errors.push("Les dates prevues sont obligatoires.");
  }

  if (Number.isNaN(budgetPrevisionnel) || budgetPrevisionnel < 0) {
    errors.push("Le budget previsionnel doit etre positif ou nul.");
  }

  if (
    Number.isNaN(pourcentageAvancement) ||
    pourcentageAvancement < 0 ||
    pourcentageAvancement > 100
  ) {
    errors.push("L'avancement doit etre compris entre 0 et 100.");
  }

  if (isBeforeDate(values.dateDebutPrevue, values.dateFinPrevue)) {
    errors.push("La date de fin prevue ne peut pas etre avant la date de debut prevue.");
  }

  if (isBeforeDate(values.dateDebutReelle, values.dateFinReelle)) {
    errors.push("La date de fin reelle ne peut pas etre avant la date de debut reelle.");
  }

  if (values.dateFinReelle && !values.dateDebutReelle) {
    errors.push(
      "La date de debut reelle est requise lorsque la date de fin reelle est renseignee.",
    );
  }

  if (statut === "TERMINE" && pourcentageAvancement !== 100) {
    errors.push("Un projet termine doit avoir un avancement de 100%.");
  }

  if (pourcentageAvancement === 100 && statut !== "TERMINE") {
    errors.push("Un avancement de 100% exige un statut Termine.");
  }

  return errors;
}

function toNullableDate(value: string) {
  return value.trim() ? value : null;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildProjectPayload(values: ProjectFormValues) {
  return {
    code: values.code.trim(),
    intitule: values.intitule.trim(),
    descriptif: values.descriptif.trim(),
    statut: normalizeProjectStatus(values.statut),
    priorite: normalizeProjectPriority(values.priorite),
    budgetPrevisionnel: toNumber(values.budgetPrevisionnel),
    pourcentageAvancement: toNumber(values.pourcentageAvancement),
    dateDebutPrevue: toNullableDate(values.dateDebutPrevue),
    dateFinPrevue: toNullableDate(values.dateFinPrevue),
    dateDebutReelle: toNullableDate(values.dateDebutReelle),
    dateFinReelle: toNullableDate(values.dateFinReelle),
  };
}

export async function getProjects(
  filters?: ProjectFilters,
  currentUser: SessionUser | null = null,
) {
  const response = await api.get("/projets", {
    params: buildProjectSearchParams(filters, currentUser),
  });
  return extractProjects(response.data).map(normalizeProject);
}

function addParam(params: Record<string, string>, key: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    params[key] = normalizedValue;
  }
}

function buildProjectSearchParams(
  filters?: ProjectFilters,
  currentUser: SessionUser | null = null,
) {
  const params: Record<string, string> = {};

  if (!filters) {
    return params;
  }

  addParam(params, "search", filters.search);

  if (filters.statut !== "all") {
    params.statut = filters.statut;
  }

  if (filters.priorite !== "all") {
    params.priorite = filters.priorite;
  }

  if (filters.niveauRisque !== "all") {
    params.niveauRisque = filters.niveauRisque;
  }

  addParam(params, "code", filters.code);
  addParam(params, "intitule", filters.intitule);
  addParam(params, "dateDebutPrevueMin", filters.dateDebutPrevueMin);
  addParam(params, "dateDebutPrevueMax", filters.dateDebutPrevueMax);
  addParam(params, "dateFinPrevueMin", filters.dateFinPrevueMin);
  addParam(params, "dateFinPrevueMax", filters.dateFinPrevueMax);
  addParam(params, "budgetMin", filters.budgetMin);
  addParam(params, "budgetMax", filters.budgetMax);
  addParam(params, "avancementMin", filters.avancementMin);
  addParam(params, "avancementMax", filters.avancementMax);

  if (filters.ownership === "mine" && currentUser?.email) {
    params.responsableEmail = currentUser.email;
  } else {
    addParam(params, "responsableId", filters.responsableId);
    addParam(params, "responsableEmail", filters.responsableEmail);
  }

  return params;
}

function getFallbackExportFilename() {
  return `projets_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

function extractFilenameFromContentDisposition(contentDisposition: string | undefined) {
  if (!contentDisposition) {
    return "";
  }

  const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8FilenameMatch?.[1]) {
    return decodeURIComponent(utf8FilenameMatch[1].replace(/"/g, ""));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? "";
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

export async function exportProjectsExcel(
  filters: ProjectFilters,
  currentUser: SessionUser | null,
) {
  const response = await api.get<Blob>("/projets/export", {
    params: buildProjectSearchParams(filters, currentUser),
    responseType: "blob",
  });
  const filename =
    extractFilenameFromContentDisposition(response.headers["content-disposition"]) ||
    getFallbackExportFilename();

  downloadBlob(response.data, filename);
  return filename;
}

export async function getProject(projectId: string) {
  const response = await api.get(`/projets/${projectId}`);
  return normalizeProject(extractProjectPayload(response.data));
}

export async function createProject(values: ProjectFormValues) {
  const response = await api.post("/projets", buildProjectPayload(values));
  return normalizeProject(extractProjectPayload(response.data));
}

export async function updateProject(projectId: string, values: ProjectFormValues) {
  const response = await api.put(`/projets/${projectId}`, buildProjectPayload(values));
  return normalizeProject(extractProjectPayload(response.data));
}

export async function deleteProject(projectId: string) {
  await api.delete(`/projets/${projectId}`);
}

export function isOwnedProject(project: Project, user: SessionUser | null) {
  if (!project.responsable || !user) {
    return false;
  }

  if (project.responsable.id && user.id) {
    return project.responsable.id === user.id;
  }

  if (project.responsable.email && user.email) {
    return project.responsable.email.toLowerCase() === user.email.toLowerCase();
  }

  return (
    project.responsable.fullName.toLowerCase() === `${user.prenom} ${user.nom}`.trim().toLowerCase()
  );
}

export function getProjectErrorMessage(error: unknown, fallback: string) {
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
    return "Vous n'etes pas autorise a effectuer cette action sur ce projet.";
  }

  if (error.response?.status === 404) {
    return "Projet introuvable.";
  }

  return fallback;
}
