export type NatureIntervention =
  "DEVELOPPEMENT" | "TEST" | "CONCEPTION" | "GESTION_PROJET" | "SUPPORT" | "MAINTENANCE" | "AUTRE";

export interface AffectationRessource {
  idAffectationRessource: number;
  natureIntervention: NatureIntervention;
  chargeJH: number;
  idProjet: number;
  codeProjet: string;
  intituleProjet: string;
  idRessource: number;
  nomRessource: string;
  fonctionRessource: string;
  natureRessource: string;
}

export interface CreateAffectationRessourceRequest {
  idProjet: number;
  idRessource: number;
  natureIntervention: NatureIntervention;
  chargeJH: number;
}

export interface UpdateAffectationRessourceRequest {
  natureIntervention: NatureIntervention;
  chargeJH: number;
}
