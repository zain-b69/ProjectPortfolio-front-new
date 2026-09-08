export type ProjectStatus = "En cours" | "Terminé" | "En retard" | "Planifié" | "Suspendu";
export type Priority = "Haute" | "Moyenne" | "Basse" | "Critique";
export type RiskLevel = "Faible" | "Moyen" | "Élevé" | "Critique";
export type UserRole = "ROLE_ADMIN" | "ROLE_RESPONSABLE_PROJET" | "ROLE_UTILISATEUR_SIMPLE";

export interface Project {
  id: string;
  code: string;
  intitule: string;
  descriptif: string;
  responsable: string;
  statut: ProjectStatus;
  priorite: Priority;
  budgetPrevisionnel: number;
  budgetConsomme: number;
  avancement: number;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle?: string;
  dateFinReelle?: string;
  niveauRisque: RiskLevel;
}

export interface Resource {
  id: string;
  nom: string;
  fonction: string;
  nature?: string;
  chargeJH?: number;
}

export interface Cost {
  id: string;
  type: string;
  montant: number;
  date: string;
}

export interface Risk {
  id: string;
  description: string;
  criticite: RiskLevel;
}

export interface Attachment {
  id: string;
  nomFichier: string;
  dateAjout: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  typeAction: string;
  description: string;
  utilisateur: string;
}

export interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  derniereConnexion: string;
}

export const mockProjects: Project[] = [
  {
    id: "p1",
    code: "PRJ-2025-001",
    intitule: "Modernisation SI Facturation",
    descriptif: "Refonte complète du système de facturation clients eau potable.",
    responsable: "K. Bennani",
    statut: "En cours",
    priorite: "Haute",
    budgetPrevisionnel: 4500000,
    budgetConsomme: 2100000,
    avancement: 45,
    dateDebutPrevue: "2025-01-15",
    dateFinPrevue: "2026-06-30",
    dateDebutReelle: "2025-01-20",
    niveauRisque: "Moyen",
  },
  {
    id: "p2",
    code: "PRJ-2025-002",
    intitule: "Plateforme GED Documentaire",
    descriptif: "Mise en place d'une GED pour la DTI.",
    responsable: "S. El Amrani",
    statut: "En cours",
    priorite: "Moyenne",
    budgetPrevisionnel: 1200000,
    budgetConsomme: 780000,
    avancement: 62,
    dateDebutPrevue: "2024-11-01",
    dateFinPrevue: "2025-08-31",
    dateDebutReelle: "2024-11-05",
    niveauRisque: "Faible",
  },
  {
    id: "p3",
    code: "PRJ-2024-014",
    intitule: "Portail Agent ONEE",
    descriptif: "Portail intranet unifié pour les agents.",
    responsable: "M. Idrissi",
    statut: "Terminé",
    priorite: "Haute",
    budgetPrevisionnel: 2800000,
    budgetConsomme: 2650000,
    avancement: 100,
    dateDebutPrevue: "2024-02-01",
    dateFinPrevue: "2024-12-15",
    dateDebutReelle: "2024-02-05",
    dateFinReelle: "2024-12-10",
    niveauRisque: "Faible",
  },
  {
    id: "p4",
    code: "PRJ-2025-003",
    intitule: "SCADA Télégestion Réseaux",
    descriptif: "Supervision temps réel des ouvrages hydrauliques.",
    responsable: "A. Chraibi",
    statut: "En retard",
    priorite: "Critique",
    budgetPrevisionnel: 8900000,
    budgetConsomme: 5400000,
    avancement: 38,
    dateDebutPrevue: "2024-09-01",
    dateFinPrevue: "2025-11-30",
    dateDebutReelle: "2024-09-15",
    niveauRisque: "Critique",
  },
  {
    id: "p5",
    code: "PRJ-2025-004",
    intitule: "Migration Cloud Privé",
    descriptif: "Migration progressive des applications vers le cloud privé.",
    responsable: "K. Bennani",
    statut: "Planifié",
    priorite: "Haute",
    budgetPrevisionnel: 3200000,
    budgetConsomme: 150000,
    avancement: 8,
    dateDebutPrevue: "2025-04-01",
    dateFinPrevue: "2026-10-31",
    niveauRisque: "Élevé",
  },
  {
    id: "p6",
    code: "PRJ-2025-005",
    intitule: "Cybersécurité SOC",
    descriptif: "Mise en place d'un Security Operations Center.",
    responsable: "N. Alaoui",
    statut: "En cours",
    priorite: "Critique",
    budgetPrevisionnel: 5600000,
    budgetConsomme: 1850000,
    avancement: 30,
    dateDebutPrevue: "2025-02-15",
    dateFinPrevue: "2025-12-31",
    dateDebutReelle: "2025-02-20",
    niveauRisque: "Élevé",
  },
  {
    id: "p7",
    code: "PRJ-2024-011",
    intitule: "App Mobile Relevé Compteurs",
    descriptif: "Application terrain pour agents de relevé.",
    responsable: "S. El Amrani",
    statut: "Terminé",
    priorite: "Moyenne",
    budgetPrevisionnel: 950000,
    budgetConsomme: 890000,
    avancement: 100,
    dateDebutPrevue: "2024-05-01",
    dateFinPrevue: "2024-11-30",
    dateDebutReelle: "2024-05-10",
    dateFinReelle: "2024-12-05",
    niveauRisque: "Faible",
  },
  {
    id: "p8",
    code: "PRJ-2025-006",
    intitule: "Datawarehouse Décisionnel",
    descriptif: "Entrepôt de données pour reporting DG.",
    responsable: "M. Idrissi",
    statut: "En retard",
    priorite: "Haute",
    budgetPrevisionnel: 2400000,
    budgetConsomme: 1600000,
    avancement: 55,
    dateDebutPrevue: "2024-10-01",
    dateFinPrevue: "2025-06-30",
    dateDebutReelle: "2024-10-15",
    niveauRisque: "Moyen",
  },
];

export const mockResources: Resource[] = [
  { id: "r1", nom: "Y. Tazi", fonction: "Chef de Projet", nature: "Interne", chargeJH: 120 },
  {
    id: "r2",
    nom: "H. Berrada",
    fonction: "Développeur Senior",
    nature: "Prestataire",
    chargeJH: 200,
  },
  { id: "r3", nom: "F. Kabbaj", fonction: "Analyste Fonctionnel", nature: "Interne", chargeJH: 90 },
  { id: "r4", nom: "R. Fassi", fonction: "Architecte SI", nature: "Interne", chargeJH: 60 },
  { id: "r5", nom: "L. Ouazzani", fonction: "DBA", nature: "Prestataire", chargeJH: 45 },
];

export const mockCosts: Cost[] = [
  { id: "c1", type: "Licences logicielles", montant: 450000, date: "2025-02-10" },
  { id: "c2", type: "Prestation externe", montant: 780000, date: "2025-03-15" },
  { id: "c3", type: "Matériel", montant: 320000, date: "2025-04-02" },
  { id: "c4", type: "Formation", montant: 55000, date: "2025-05-20" },
];

export const mockRisks: Risk[] = [
  { id: "rk1", description: "Retard livraison composants matériels", criticite: "Élevé" },
  { id: "rk2", description: "Résistance au changement métier", criticite: "Moyen" },
  { id: "rk3", description: "Indisponibilité ressources clés", criticite: "Critique" },
];

export const mockAttachments: Attachment[] = [
  { id: "a1", nomFichier: "Cahier_des_charges_v2.pdf", dateAjout: "2025-01-18" },
  { id: "a2", nomFichier: "Planning_projet.xlsx", dateAjout: "2025-02-05" },
  { id: "a3", nomFichier: "PV_Comite_Pilotage_03.pdf", dateAjout: "2025-03-22" },
];

export const mockHistory: HistoryEntry[] = [
  {
    id: "h1",
    date: "2025-06-14 09:12",
    typeAction: "Modification",
    description: "Mise à jour avancement à 45%",
    utilisateur: "K. Bennani",
  },
  {
    id: "h2",
    date: "2025-05-30 15:44",
    typeAction: "Ajout",
    description: "Ajout d'un nouveau risque critique",
    utilisateur: "K. Bennani",
  },
  {
    id: "h3",
    date: "2025-05-12 11:03",
    typeAction: "Modification",
    description: "Budget révisé à la hausse",
    utilisateur: "A. Admin",
  },
  {
    id: "h4",
    date: "2025-04-28 08:20",
    typeAction: "Ajout",
    description: "Pièce jointe: PV_Comite_Pilotage_03.pdf",
    utilisateur: "K. Bennani",
  },
];

export const mockUsers: AppUser[] = [
  {
    id: "u1",
    nom: "Alami",
    prenom: "Ahmed",
    email: "a.alami@onee.ma",
    role: "ROLE_ADMIN",
    derniereConnexion: "2025-07-08 08:15",
  },
  {
    id: "u2",
    nom: "Bennani",
    prenom: "Karim",
    email: "k.bennani@onee.ma",
    role: "ROLE_RESPONSABLE_PROJET",
    derniereConnexion: "2025-07-07 17:42",
  },
  {
    id: "u3",
    nom: "El Amrani",
    prenom: "Salma",
    email: "s.elamrani@onee.ma",
    role: "ROLE_RESPONSABLE_PROJET",
    derniereConnexion: "2025-07-07 14:20",
  },
  {
    id: "u4",
    nom: "Idrissi",
    prenom: "Mounir",
    email: "m.idrissi@onee.ma",
    role: "ROLE_RESPONSABLE_PROJET",
    derniereConnexion: "2025-07-06 09:55",
  },
  {
    id: "u5",
    nom: "Chraibi",
    prenom: "Amine",
    email: "a.chraibi@onee.ma",
    role: "ROLE_RESPONSABLE_PROJET",
    derniereConnexion: "2025-07-05 16:30",
  },
  {
    id: "u6",
    nom: "Naciri",
    prenom: "Leila",
    email: "l.naciri@onee.ma",
    role: "ROLE_UTILISATEUR_SIMPLE",
    derniereConnexion: "2025-07-08 07:50",
  },
];

export const currentUser = {
  nom: "Alami",
  prenom: "Ahmed",
  email: "a.alami@onee.ma",
  role: "ROLE_ADMIN" as UserRole,
};

export function exportToCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " MAD";
}
