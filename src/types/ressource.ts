export type NatureRessource = "INTERNE" | "PRESTATAIRE";

export interface Ressource {
  idRessource: number;
  nom: string;
  fonction: string;
  nature: NatureRessource;
}

export interface CreateRessourceRequest {
  nom: string;
  fonction: string;
  nature: NatureRessource;
}

export interface UpdateRessourceRequest {
  nom: string;
  fonction: string;
  nature: NatureRessource;
}

export interface RessourceSearchParams {
  texte?: string;
  nature?: NatureRessource;
}
