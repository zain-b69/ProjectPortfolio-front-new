import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  Pencil,
  Plus,
  ShieldAlert,
  Target,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAffectation,
  deleteAffectation,
  getAffectationRessourceErrorMessage,
  getAffectationsByProjet,
  updateAffectation,
} from "@/services/affectationRessourceService";
import { getRessources } from "@/services/ressourceService";
import type {
  AffectationRessource,
  CreateAffectationRessourceRequest,
  NatureIntervention,
  UpdateAffectationRessourceRequest,
} from "@/types/affectationRessource";
import type { Ressource } from "@/types/ressource";
import {
  createRisk,
  deleteRisk,
  getProjectRisks,
  getRiskErrorMessage,
  updateRisk,
  type NiveauCriticite,
  type RiskFormValues,
  type RisqueResponse,
} from "@/services/riskService";
import {
  createCost,
  deleteCost,
  getCostErrorMessage,
  getProjectCosts,
  updateCost,
  type CostFormValues,
  type CoutResponse,
  type TypeCout,
} from "@/services/costService";
import {
  deleteProject,
  formatDate,
  formatMad,
  formatProjectPriority,
  formatProjectRiskLevel,
  formatProjectStatus,
  getProject,
  getProjectErrorMessage,
  isOwnedProject,
} from "@/services/projectService";
import { isProjectManager } from "@/services/sessionService";
import { cn } from "@/lib/utils";
import { useClientSession } from "@/hooks/use-client-session";
import { Route as ProjectEditRoute } from "./_app.projets.$id.edit";
import { toast } from "sonner";
import { UploadPieceJointeDialog } from "@/components/UploadPieceJointeDialog";
import {
  getPiecesJointes,
  downloadPieceJointe,
  deletePieceJointe,
  type PieceJointeResponse,
} from "@/services/pieceJointeService";
import {
  formatHistoriqueDate,
  formatTypeAction,
  getProjectHistorique,
} from "@/services/historiqueService";

export const Route = createFileRoute("/_app/projets/$id")({
  head: () => ({ meta: [{ title: "Detail projet - ProjectPortfolio" }] }),
  component: ProjectDetailPage,
});

function exportProject(project: Awaited<ReturnType<typeof getProject>>) {
  const rows = [
    ["Code", project.code],
    ["Intitule", project.intitule],
    ["Description", project.description],
    ["Responsable", project.responsable?.fullName ?? project.responsable?.email ?? ""],
    ["Statut", formatProjectStatus(project.statut)],
    ["Priorite", formatProjectPriority(project.priorite)],
    ["Risque", formatProjectRiskLevel(project.niveauRisque)],
    ["Budget previsionnel", project.budgetPrevisionnel],
    ["Budget consomme", project.budgetConsomme],
    ["Avancement", `${project.avancement}%`],
    ["Date debut prevue", project.dateDebutPrevue],
    ["Date fin prevue", project.dateFinPrevue],
    ["Date debut reelle", project.dateDebutReelle],
    ["Date fin reelle", project.dateFinReelle],
  ];
  const csv = rows
    .map(
      ([label, value]) =>
        `"${String(label).replace(/"/g, '""')}";"${String(value ?? "").replace(/"/g, '""')}"`,
    )
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.code || "projet"}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function EmptyTableMessage({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

const natureInterventionLabels: Record<NatureIntervention, string> = {
  DEVELOPPEMENT: "Développement",
  TEST: "Test",
  CONCEPTION: "Conception",
  GESTION_PROJET: "Gestion de projet",
  SUPPORT: "Support",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
};

const natureInterventionOptions: Array<{ value: NatureIntervention; label: string }> =
  Object.entries(natureInterventionLabels).map(([value, label]) => ({
    value: value as NatureIntervention,
    label,
  }));

function formatNatureIntervention(nature: NatureIntervention) {
  return natureInterventionLabels[nature] ?? nature;
}

const criticalityLabels: Record<NiveauCriticite, string> = {
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  ELEVE: "Élevé",
  CRITIQUE: "Critique",
};

const criticalityOptions: Array<{ value: NiveauCriticite; label: string }> = Object.entries(
  criticalityLabels,
).map(([value, label]) => ({
  value: value as NiveauCriticite,
  label,
}));

const riskPriority: Record<NiveauCriticite, number> = {
  FAIBLE: 1,
  MOYEN: 2,
  ELEVE: 3,
  CRITIQUE: 4,
};

function formatCriticality(niveauCriticite: NiveauCriticite) {
  return criticalityLabels[niveauCriticite] ?? niveauCriticite;
}

const costTypeLabels: Record<TypeCout, string> = {
  MATERIEL: "Matériel",
  LOGICIEL: "Logiciel",
  PRESTATION: "Prestation",
  FORMATION: "Formation",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
};

const costTypeOptions: Array<{ value: TypeCout; label: string }> = Object.entries(
  costTypeLabels,
).map(([value, label]) => ({
  value: value as TypeCout,
  label,
}));

function formatCostType(type: TypeCout) {
  return costTypeLabels[type] ?? type;
}

function formatCostAmount(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
  }).format(value);
}

function AffectationRowsSkeleton({ showActions }: { showActions: boolean }) {
  return Array.from({ length: 4 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
      {showActions ? (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  ));
}

function RiskRowsSkeleton({ showActions }: { showActions: boolean }) {
  return Array.from({ length: 3 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-full max-w-xl" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      {showActions ? (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  ));
}

function CostRowsSkeleton({ showActions }: { showActions: boolean }) {
  return Array.from({ length: 3 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      {showActions ? (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  ));
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function hasAtMostTwoDecimals(value: string) {
  return /^\d+([.,]\d{1,2})?$/.test(value.trim());
}

function normalizeAmountInput(value: string) {
  return value.trim().replace(",", ".");
}

function CreateAffectationDialog({
  open,
  onOpenChange,
  projectId,
  resources,
  isResourcesLoading,
  isResourcesError,
  onRetryResources,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  resources: Ressource[];
  isResourcesLoading: boolean;
  isResourcesError: boolean;
  onRetryResources: () => void;
  onSubmit: (request: CreateAffectationRessourceRequest) => void;
  isPending: boolean;
}) {
  const [resourceId, setResourceId] = useState("");
  const [natureIntervention, setNatureIntervention] = useState<NatureIntervention>("DEVELOPPEMENT");
  const [chargeJH, setChargeJH] = useState("");

  useEffect(() => {
    if (!open) {
      setResourceId("");
      setNatureIntervention("DEVELOPPEMENT");
      setChargeJH("");
    }
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const idRessource = Number(resourceId);
    const parsedCharge = parsePositiveNumber(chargeJH);

    if (!Number.isInteger(idRessource) || idRessource <= 0) {
      toast.error("La ressource est obligatoire.");
      return;
    }

    if (!natureIntervention) {
      toast.error("La nature d'intervention est obligatoire.");
      return;
    }

    if (parsedCharge == null) {
      toast.error("La charge JH doit etre strictement positive.");
      return;
    }

    onSubmit({
      idProjet: projectId,
      idRessource,
      natureIntervention,
      chargeJH: parsedCharge,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Affecter une ressource</DialogTitle>
          <DialogDescription>
            Selectionnez une ressource et sa charge sur ce projet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ressource</Label>
            <Select
              value={resourceId}
              onValueChange={setResourceId}
              disabled={
                isPending || isResourcesLoading || isResourcesError || resources.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isResourcesLoading
                      ? "Chargement des ressources..."
                      : "Selectionner une ressource"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {resources.map((resource) => (
                  <SelectItem key={resource.idRessource} value={String(resource.idRessource)}>
                    {resource.nom} - {resource.fonction}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isResourcesError ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <span>Impossible de charger les ressources.</span>
                <Button type="button" variant="outline" size="sm" onClick={onRetryResources}>
                  Reessayer
                </Button>
              </div>
            ) : null}
            {!isResourcesLoading && !isResourcesError && resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune ressource disponible a affecter.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Nature d'intervention</Label>
            <Select
              value={natureIntervention}
              onValueChange={(value) => setNatureIntervention(value as NatureIntervention)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une nature" />
              </SelectTrigger>
              <SelectContent>
                {natureInterventionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignment-charge">Charge JH</Label>
            <Input
              id="assignment-charge"
              type="number"
              min="0.01"
              step="0.01"
              value={chargeJH}
              onChange={(event) => setChargeJH(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || isResourcesLoading || isResourcesError || resources.length === 0
              }
            >
              {isPending ? "Affectation..." : "Affecter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAffectationDialog({
  open,
  affectation,
  onOpenChange,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  affectation: AffectationRessource | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (affectationId: number, request: UpdateAffectationRessourceRequest) => void;
  isPending: boolean;
}) {
  const [natureIntervention, setNatureIntervention] = useState<NatureIntervention>("DEVELOPPEMENT");
  const [chargeJH, setChargeJH] = useState("");

  useEffect(() => {
    if (!affectation) {
      setNatureIntervention("DEVELOPPEMENT");
      setChargeJH("");
      return;
    }

    setNatureIntervention(affectation.natureIntervention);
    setChargeJH(String(affectation.chargeJH));
  }, [affectation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!affectation || isPending) {
      return;
    }

    const parsedCharge = parsePositiveNumber(chargeJH);

    if (!natureIntervention) {
      toast.error("La nature d'intervention est obligatoire.");
      return;
    }

    if (parsedCharge == null) {
      toast.error("La charge JH doit etre strictement positive.");
      return;
    }

    onSubmit(affectation.idAffectationRessource, {
      natureIntervention,
      chargeJH: parsedCharge,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'affectation</DialogTitle>
          <DialogDescription>
            Ajustez la nature d'intervention et la charge de la ressource.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">{affectation?.nomRessource ?? "Ressource"}</p>
            <p className="text-xs text-muted-foreground">{affectation?.fonctionRessource ?? "-"}</p>
          </div>

          <div className="space-y-2">
            <Label>Nature d'intervention</Label>
            <Select
              value={natureIntervention}
              onValueChange={(value) => setNatureIntervention(value as NatureIntervention)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une nature" />
              </SelectTrigger>
              <SelectContent>
                {natureInterventionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-assignment-charge">Charge JH</Label>
            <Input
              id="edit-assignment-charge"
              type="number"
              min="0.01"
              step="0.01"
              value={chargeJH}
              onChange={(event) => setChargeJH(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onClose();
              }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !affectation}>
              {isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAffectationDialog({
  open,
  affectation,
  onOpenChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  affectation: AffectationRessource | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirm: (affectationId: number) => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer l'affectation ?</AlertDialogTitle>
          <AlertDialogDescription>
            {affectation
              ? `Cette action retirera ${affectation.nomRessource} de ce projet sans supprimer la ressource du catalogue.`
              : "Cette action retirera cette ressource du projet sans la supprimer du catalogue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !affectation}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();

              if (!affectation) {
                return;
              }

              onConfirm(affectation.idAffectationRessource);
            }}
          >
            {isPending ? "Retrait..." : "Retirer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RiskFormDialog({
  open,
  title,
  description,
  risk,
  onOpenChange,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  title: string;
  description: string;
  risk?: RisqueResponse | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (values: RiskFormValues) => void;
  isPending: boolean;
}) {
  const [riskDescription, setRiskDescription] = useState("");
  const [niveauCriticite, setNiveauCriticite] = useState<NiveauCriticite>("MOYEN");

  useEffect(() => {
    if (!open) {
      setRiskDescription("");
      setNiveauCriticite("MOYEN");
      return;
    }

    setRiskDescription(risk?.description ?? "");
    setNiveauCriticite(risk?.niveauCriticite ?? "MOYEN");
  }, [open, risk]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const trimmedDescription = riskDescription.trim();

    if (!trimmedDescription) {
      toast.error("La description du risque est obligatoire.");
      return;
    }

    if (trimmedDescription.length > 1000) {
      toast.error("La description du risque ne peut pas depasser 1000 caracteres.");
      return;
    }

    if (!niveauCriticite) {
      toast.error("La criticite est obligatoire.");
      return;
    }

    onSubmit({
      description: trimmedDescription,
      niveauCriticite,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="risk-description">Description</Label>
            <Textarea
              id="risk-description"
              value={riskDescription}
              onChange={(event) => setRiskDescription(event.target.value)}
              disabled={isPending}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {riskDescription.length}/1000 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label>Criticite</Label>
            <Select
              value={niveauCriticite}
              onValueChange={(value) => setNiveauCriticite(value as NiveauCriticite)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une criticite" />
              </SelectTrigger>
              <SelectContent>
                {criticalityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onClose();
              }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRiskDialog({
  open,
  risk,
  onOpenChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  risk: RisqueResponse | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirm: (riskId: number) => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le risque ?</AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous vraiment supprimer ce risque ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !risk}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();

              if (!risk) {
                return;
              }

              onConfirm(risk.idRisque);
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CostFormDialog({
  open,
  title,
  description,
  cost,
  onOpenChange,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  title: string;
  description: string;
  cost?: CoutResponse | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (values: CostFormValues) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState<TypeCout>("MATERIEL");
  const [montant, setMontant] = useState("");
  const [dateCout, setDateCout] = useState("");

  useEffect(() => {
    if (!open) {
      setType("MATERIEL");
      setMontant("");
      setDateCout("");
      return;
    }

    setType(cost?.type ?? "MATERIEL");
    setMontant(cost ? String(cost.montant) : "");
    setDateCout(cost?.dateCout ?? "");
  }, [open, cost]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const normalizedMontant = normalizeAmountInput(montant);
    const parsedMontant = parsePositiveNumber(normalizedMontant);

    if (!type) {
      toast.error("Le type est obligatoire.");
      return;
    }

    if (!normalizedMontant) {
      toast.error("Le montant est obligatoire.");
      return;
    }

    if (parsedMontant == null) {
      toast.error("Le montant doit être strictement supérieur à zéro.");
      return;
    }

    if (!hasAtMostTwoDecimals(normalizedMontant)) {
      toast.error("Le montant ne peut pas avoir plus de deux décimales.");
      return;
    }

    if (!dateCout) {
      toast.error("La date du coût est obligatoire.");
      return;
    }

    onSubmit({
      type,
      montant: normalizedMontant,
      dateCout,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as TypeCout)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {costTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={cost ? "edit-cost-amount" : "create-cost-amount"}>Montant</Label>
            <Input
              id={cost ? "edit-cost-amount" : "create-cost-amount"}
              type="number"
              min="0.01"
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={cost ? "edit-cost-date" : "create-cost-date"}>Date du coût</Label>
            <Input
              id={cost ? "edit-cost-date" : "create-cost-date"}
              type="date"
              value={dateCout}
              onChange={(event) => setDateCout(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onClose();
              }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCostDialog({
  open,
  cost,
  onOpenChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  cost: CoutResponse | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirm: (costId: number) => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le coût ?</AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous vraiment supprimer ce coût ? Cette action est irréversible.
            {cost
              ? ` ${formatCostType(cost.type)} - ${formatCostAmount(Number(cost.montant))}.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !cost}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();

              if (!cost) {
                return;
              }

              onConfirm(cost.idCout);
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const projectId = Number(id);
  const hasValidProjectId = Number.isInteger(projectId) && projectId > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { currentUser, isSessionReady } = useClientSession();
  const [activeTab, setActiveTab] = useState("infos");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createAffectationOpen, setCreateAffectationOpen] = useState(false);
  const [editAffectationOpen, setEditAffectationOpen] = useState(false);
  const [deleteAffectationOpen, setDeleteAffectationOpen] = useState(false);
  const [selectedAffectation, setSelectedAffectation] = useState<AffectationRessource | null>(null);
  const [createRiskOpen, setCreateRiskOpen] = useState(false);
  const [editRiskOpen, setEditRiskOpen] = useState(false);
  const [deleteRiskOpen, setDeleteRiskOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RisqueResponse | null>(null);
  const [createCostOpen, setCreateCostOpen] = useState(false);
  const [editCostOpen, setEditCostOpen] = useState(false);
  const [deleteCostOpen, setDeleteCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<CoutResponse | null>(null);
  const affectationsQueryKey = ["projets", projectId, "affectations-ressources"] as const;
  const risksQueryKey = ["project-risks", projectId] as const;
  const costsQueryKey = ["project-costs", projectId] as const;
  const piecesJointesQueryKey = ["project-attachments", projectId] as const;
  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => getProject(id),
  });
  const {
    data: affectations = [],
    isLoading: isAffectationsLoading,
    isError: isAffectationsError,
    error: affectationsError,
    refetch: refetchAffectations,
  } = useQuery({
    queryKey: affectationsQueryKey,
    queryFn: () => getAffectationsByProjet(projectId),
    enabled: hasValidProjectId && pathname === `/projets/${id}`,
  });
  const {
    data: risks = [],
    isLoading: isRisksLoading,
    isError: isRisksError,
    error: risksError,
    refetch: refetchRisks,
  } = useQuery({
    queryKey: risksQueryKey,
    queryFn: () => getProjectRisks(projectId),
    enabled: hasValidProjectId && pathname === `/projets/${id}`,
  });
  const {
    data: costs = [],
    isLoading: isCostsLoading,
    isError: isCostsError,
    error: costsError,
    refetch: refetchCosts,
  } = useQuery({
    queryKey: costsQueryKey,
    queryFn: () => getProjectCosts(projectId),
    enabled: hasValidProjectId && pathname === `/projets/${id}`,
  });
  const {
    data: piecesJointes = [],
    isLoading: isPiecesJointesLoading,
    isError: isPiecesJointesError,
    error: piecesJointesError,
    refetch: refetchPiecesJointes,
  } = useQuery({
    queryKey: piecesJointesQueryKey,
    queryFn: () => getPiecesJointes(projectId),
    enabled: hasValidProjectId && pathname === `/projets/${id}`,
  });
  const historiqueQueryKey = ["project-historique", projectId] as const;
  const {
    data: historique = [],
    isLoading: isHistoriqueLoading,
    isError: isHistoriqueError,
    refetch: refetchHistorique,
  } = useQuery({
    queryKey: historiqueQueryKey,
    queryFn: () => getProjectHistorique(projectId),
    enabled: hasValidProjectId && pathname === `/projets/${id}`,
  });
  const isProjectOwner = Boolean(project && isOwnedProject(project, currentUser));
  const canManageRisks = Boolean(
    project && isProjectManager(currentUser) && isOwnedProject(project, currentUser),
  );
  const canManageCosts = Boolean(
    project && isProjectManager(currentUser) && isOwnedProject(project, currentUser),
  );
  const canManageAssignments = Boolean(
    isSessionReady &&
    project &&
    hasValidProjectId &&
    (currentUser?.role === "ROLE_ADMIN" || (isProjectManager(currentUser) && isProjectOwner)),
  );
  const {
    data: resources = [],
    isLoading: isResourcesLoading,
    isError: isResourcesError,
    refetch: refetchResources,
  } = useQuery({
    queryKey: ["ressources"],
    queryFn: () => getRessources(),
    enabled: canManageAssignments && createAffectationOpen,
  });
  const availableResources = useMemo(() => {
    const affectedResourceIds = new Set(affectations.map((affectation) => affectation.idRessource));

    return resources.filter((resource) => !affectedResourceIds.has(resource.idRessource));
  }, [affectations, resources]);

  const canEdit = Boolean(
    isSessionReady &&
    project &&
    isProjectManager(currentUser) &&
    isOwnedProject(project, currentUser),
  );
  const canDelete = canEdit;

  const handleDownloadPieceJointe = async (pieceJointe: PieceJointeResponse) => {
    try {
      const { blob, filename } = await downloadPieceJointe(pieceJointe.idPieceJointe);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Erreur lors du téléchargement.");
    }
  };

  const handleDeletePieceJointe = async (pieceJointe: PieceJointeResponse) => {
    try {
      await deletePieceJointe(pieceJointe.idPieceJointe);
      toast.success("Pièce jointe supprimée.");
      await queryClient.invalidateQueries({
        queryKey: piecesJointesQueryKey,
      });
    } catch (e) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleUploadSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: piecesJointesQueryKey,
    });

    setUploadDialogOpen(false);
  };

  const montantConsomme = costs.reduce((total, cost) => total + Number(cost.montant), 0);
  const budgetPrevisionnel = Number(project?.budgetPrevisionnel ?? 0);
  const budgetRestant = budgetPrevisionnel - montantConsomme;
  const isBudgetOverrun = budgetRestant < 0;
  const highestRisk =
    !isRisksLoading && !isRisksError
      ? risks.reduce<RisqueResponse | null>((highest, risk) => {
          if (
            !highest ||
            riskPriority[risk.niveauCriticite] > riskPriority[highest.niveauCriticite]
          ) {
            return risk;
          }

          return highest;
        }, null)
      : null;

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      toast.success("Projet supprime avec succes.");
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await navigate({ to: "/projets" });
    },
    onError: (mutationError) => {
      toast.error(getProjectErrorMessage(mutationError, "Impossible de supprimer le projet."));
    },
  });
  const createAffectationMutation = useMutation({
    mutationFn: (request: CreateAffectationRessourceRequest) =>
      createAffectation(projectId, request),
    onSuccess: async () => {
      toast.success("Affectation creee avec succes.");
      await queryClient.invalidateQueries({ queryKey: affectationsQueryKey });
      setCreateAffectationOpen(false);
    },
    onError: (mutationError) => {
      toast.error(
        getAffectationRessourceErrorMessage(
          mutationError,
          "Impossible de creer l'affectation. Verifiez que la ressource n'est pas deja affectee, que l'acces est autorise et que la charge est valide.",
        ),
      );
    },
  });
  const updateAffectationMutation = useMutation({
    mutationFn: ({
      affectationId,
      request,
    }: {
      affectationId: number;
      request: UpdateAffectationRessourceRequest;
    }) => updateAffectation(projectId, affectationId, request),
    onSuccess: async () => {
      toast.success("Affectation modifiee avec succes.");
      await queryClient.invalidateQueries({ queryKey: affectationsQueryKey });
      setEditAffectationOpen(false);
      setSelectedAffectation(null);
    },
    onError: (mutationError) => {
      toast.error(
        getAffectationRessourceErrorMessage(
          mutationError,
          "Impossible de modifier l'affectation. Verifiez l'acces, l'existence de l'affectation et la charge JH.",
        ),
      );
    },
  });
  const deleteAffectationMutation = useMutation({
    mutationFn: (affectationId: number) => deleteAffectation(projectId, affectationId),
    onSuccess: async () => {
      toast.success("Affectation retiree avec succes.");
      await queryClient.invalidateQueries({ queryKey: affectationsQueryKey });
      setDeleteAffectationOpen(false);
      setSelectedAffectation(null);
    },
    onError: (mutationError) => {
      toast.error(
        getAffectationRessourceErrorMessage(
          mutationError,
          "Impossible de retirer l'affectation. Verifiez l'acces ou l'existence du projet et de l'affectation.",
        ),
      );
    },
  });
  const createRiskMutation = useMutation({
    mutationFn: (values: RiskFormValues) => createRisk(projectId, values),
    onSuccess: async () => {
      toast.success("Risque ajouté avec succès.");
      await queryClient.invalidateQueries({ queryKey: risksQueryKey });
      setCreateRiskOpen(false);
    },
    onError: (mutationError) => {
      toast.error(getRiskErrorMessage(mutationError, "Impossible d'ajouter le risque."));
    },
  });
  const updateRiskMutation = useMutation({
    mutationFn: ({ riskId, values }: { riskId: number; values: RiskFormValues }) =>
      updateRisk(riskId, values),
    onSuccess: async () => {
      toast.success("Risque modifié avec succès.");
      await queryClient.invalidateQueries({ queryKey: risksQueryKey });
      setEditRiskOpen(false);
      setSelectedRisk(null);
    },
    onError: (mutationError) => {
      toast.error(getRiskErrorMessage(mutationError, "Impossible de modifier le risque."));
    },
  });
  const deleteRiskMutation = useMutation({
    mutationFn: (riskId: number) => deleteRisk(riskId),
    onSuccess: async () => {
      toast.success("Risque supprimé avec succès.");
      await queryClient.invalidateQueries({ queryKey: risksQueryKey });
      setDeleteRiskOpen(false);
      setSelectedRisk(null);
    },
    onError: (mutationError) => {
      toast.error(getRiskErrorMessage(mutationError, "Impossible de supprimer le risque."));
    },
  });
  const createCostMutation = useMutation({
    mutationFn: (values: CostFormValues) => createCost(projectId, values),
    onSuccess: async () => {
      toast.success("Coût ajouté avec succès.");
      await queryClient.invalidateQueries({ queryKey: costsQueryKey });
      setCreateCostOpen(false);
    },
    onError: (mutationError) => {
      toast.error(getCostErrorMessage(mutationError, "Impossible d'ajouter le coût."));
    },
  });
  const updateCostMutation = useMutation({
    mutationFn: ({ costId, values }: { costId: number; values: CostFormValues }) =>
      updateCost(costId, values),
    onSuccess: async () => {
      toast.success("Coût modifié avec succès.");
      await queryClient.invalidateQueries({ queryKey: costsQueryKey });
      setEditCostOpen(false);
      setSelectedCost(null);
    },
    onError: (mutationError) => {
      toast.error(getCostErrorMessage(mutationError, "Impossible de modifier le coût."));
    },
  });
  const deleteCostMutation = useMutation({
    mutationFn: (costId: number) => deleteCost(costId),
    onSuccess: async () => {
      toast.success("Coût supprimé avec succès.");
      await queryClient.invalidateQueries({ queryKey: costsQueryKey });
      setDeleteCostOpen(false);
      setSelectedCost(null);
    },
    onError: (mutationError) => {
      toast.error(getCostErrorMessage(mutationError, "Impossible de supprimer le coût."));
    },
  });
  const isAffectationMutationPending =
    createAffectationMutation.isPending ||
    updateAffectationMutation.isPending ||
    deleteAffectationMutation.isPending;
  const isRiskMutationPending =
    createRiskMutation.isPending || updateRiskMutation.isPending || deleteRiskMutation.isPending;
  const isCostMutationPending =
    createCostMutation.isPending || updateCostMutation.isPending || deleteCostMutation.isPending;

  function handleEditAffectation(affectation: AffectationRessource) {
    setSelectedAffectation(affectation);
    setEditAffectationOpen(true);
  }

  function handleDeleteAffectation(affectation: AffectationRessource) {
    setSelectedAffectation(affectation);
    setDeleteAffectationOpen(true);
  }

  function clearSelectedAffectation() {
    setSelectedAffectation(null);
  }

  function handleEditRisk(risk: RisqueResponse) {
    setSelectedRisk(risk);
    setEditRiskOpen(true);
  }

  function handleDeleteRisk(risk: RisqueResponse) {
    setSelectedRisk(risk);
    setDeleteRiskOpen(true);
  }

  function clearSelectedRisk() {
    setSelectedRisk(null);
  }

  function handleEditCost(cost: CoutResponse) {
    setSelectedCost(cost);
    setEditCostOpen(true);
  }

  function handleDeleteCost(cost: CoutResponse) {
    setSelectedCost(cost);
    setDeleteCostOpen(true);
  }

  function clearSelectedCost() {
    setSelectedCost(null);
  }

  if (pathname !== `/projets/${id}`) {
    return <Outlet />;
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Chargement du projet...</div>;
  }

  if (isError || !project) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Projet indisponible</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{getProjectErrorMessage(error, "Impossible de charger ce projet.")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/projets">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div className="ml-auto flex gap-2">
          {canEdit ? (
            <Button asChild size="sm" className="gap-2 bg-primary text-primary-foreground">
              <Link to={ProjectEditRoute.to} params={{ id: project.id }}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
          ) : null}
          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera definitivement {project.intitule || "ce projet"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(event) => {
                      event.preventDefault();
                      deleteMutation.mutate(project.id);
                    }}
                  >
                    {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <p className="font-mono text-xs opacity-80">{project.code || "-"}</p>
          <h1 className="mt-1 text-2xl font-bold">{project.intitule || "Projet"}</h1>
          <p className="mt-2 max-w-3xl text-sm opacity-90">
            {project.description || "Aucune description disponible."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-primary-foreground">
              {formatProjectStatus(project.statut)}
            </Badge>
            <Badge className="bg-white/20 text-primary-foreground">
              Priorite {formatProjectPriority(project.priorite)}
            </Badge>
            {highestRisk ? (
              <Badge className="bg-white/20 text-primary-foreground">
                Risque {formatCriticality(highestRisk.niveauCriticite)}
              </Badge>
            ) : null}
          </div>
        </div>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: User,
              label: "Responsable",
              value: project.responsable?.fullName || project.responsable?.email || "Non affecte",
            },
            {
              icon: Calendar,
              label: "Periode prevue",
              value: `${formatDate(project.dateDebutPrevue)} -> ${formatDate(project.dateFinPrevue)}`,
            },
            { icon: Target, label: "Budget prevu", value: formatMad(project.budgetPrevisionnel) },
            {
              icon: ShieldAlert,
              label: "Budget consomme",
              value: formatMad(montantConsomme),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Avancement global</span>
              <span className="tabular-nums font-semibold">{project.avancement}%</span>
            </div>
            <Progress value={project.avancement} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="ressources">Ressources</TabsTrigger>
          <TabsTrigger value="couts">Couts</TabsTrigger>
          <TabsTrigger value="risques">Risques</TabsTrigger>
          <TabsTrigger value="pj">Pieces jointes</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="infos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Code", project.code],
                  ["Intitule", project.intitule],
                  [
                    "Responsable",
                    project.responsable?.fullName || project.responsable?.email || "-",
                  ],
                  ["Statut", formatProjectStatus(project.statut)],
                  ["Priorite", formatProjectPriority(project.priorite)],
                  ["Pourcentage d'avancement", `${project.avancement}%`],
                  ["Date debut prevue", formatDate(project.dateDebutPrevue)],
                  ["Date fin prevue", formatDate(project.dateFinPrevue)],
                  ["Date debut reelle", formatDate(project.dateDebutReelle)],
                  ["Date fin reelle", formatDate(project.dateFinReelle)],
                  ["Budget previsionnel", formatMad(project.budgetPrevisionnel)],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-border/60 pb-2">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{value || "-"}</dd>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Descriptif
                  </dt>
                  <dd className="mt-1 text-sm">{project.description || "Aucune description."}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ressources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Affectations de ressources</CardTitle>
              {canManageAssignments ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-primary text-primary-foreground"
                  disabled={isAffectationMutationPending || !hasValidProjectId}
                  onClick={() => setCreateAffectationOpen(true)}
                >
                  <User className="h-4 w-4" />
                  Affecter une ressource
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nom</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Nature ressource</TableHead>
                    <TableHead>Nature intervention</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    {canManageAssignments ? (
                      <TableHead className="text-right">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasValidProjectId ? (
                    <EmptyTableMessage
                      colSpan={canManageAssignments ? 6 : 5}
                      message="Identifiant projet invalide pour charger les affectations."
                    />
                  ) : isAffectationsLoading ? (
                    <AffectationRowsSkeleton showActions={canManageAssignments} />
                  ) : isAffectationsError ? (
                    <TableRow>
                      <TableCell colSpan={canManageAssignments ? 6 : 5} className="py-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              Impossible de charger les affectations de ressources.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getAffectationRessourceErrorMessage(
                                affectationsError,
                                "Impossible de charger les affectations de ressources.",
                              )}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetchAffectations()}
                          >
                            Reessayer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : affectations.length > 0 ? (
                    affectations.map((affectation) => (
                      <TableRow key={affectation.idAffectationRessource}>
                        <TableCell className="font-medium">
                          {affectation.nomRessource || "-"}
                        </TableCell>
                        <TableCell>{affectation.fonctionRessource || "-"}</TableCell>
                        <TableCell>{affectation.natureRessource || "-"}</TableCell>
                        <TableCell>
                          {formatNatureIntervention(affectation.natureIntervention)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {affectation.chargeJH} JH
                        </TableCell>
                        {canManageAssignments ? (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={isAffectationMutationPending}
                                onClick={() => handleEditAffectation(affectation)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                disabled={isAffectationMutationPending}
                                onClick={() => handleDeleteAffectation(affectation)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableMessage
                      colSpan={canManageAssignments ? 6 : 5}
                      message="Aucune affectation de ressource rattachee a ce projet."
                    />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="couts">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Budget prévisionnel", formatMad(budgetPrevisionnel)],
                ["Montant consommé", formatMad(montantConsomme)],
                [
                  isBudgetOverrun ? "Dépassement" : "Budget restant",
                  formatMad(Math.abs(budgetRestant)),
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p
                    className={
                      label === "Dépassement"
                        ? "mt-2 text-lg font-semibold text-destructive"
                        : "mt-2 text-lg font-semibold"
                    }
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">Coûts du projet</CardTitle>
                {canManageCosts ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bg-primary text-primary-foreground"
                    disabled={isCostMutationPending || !hasValidProjectId}
                    onClick={() => setCreateCostOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un coût
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date</TableHead>
                      {canManageCosts ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!hasValidProjectId ? (
                      <EmptyTableMessage
                        colSpan={canManageCosts ? 4 : 3}
                        message="Identifiant projet invalide pour charger les coûts."
                      />
                    ) : isCostsLoading ? (
                      <CostRowsSkeleton showActions={canManageCosts} />
                    ) : isCostsError ? (
                      <TableRow>
                        <TableCell colSpan={canManageCosts ? 4 : 3} className="py-8">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                Impossible de charger les coûts.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getCostErrorMessage(
                                  costsError,
                                  "Impossible de charger les coûts.",
                                )}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => void refetchCosts()}>
                              Réessayer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : costs.length > 0 ? (
                      costs.map((cost) => (
                        <TableRow key={cost.idCout}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{formatCostType(cost.type)}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCostAmount(Number(cost.montant))}
                          </TableCell>
                          <TableCell>{formatDate(cost.dateCout)}</TableCell>
                          {canManageCosts ? (
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={isCostMutationPending}
                                  onClick={() => handleEditCost(cost)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  disabled={isCostMutationPending}
                                  onClick={() => handleDeleteCost(cost)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    ) : (
                      <EmptyTableMessage
                        colSpan={canManageCosts ? 4 : 3}
                        message="Aucun coût enregistré pour ce projet."
                      />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risques">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Risques du projet</CardTitle>
              {canManageRisks ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-primary text-primary-foreground"
                  disabled={isRiskMutationPending || !hasValidProjectId}
                  onClick={() => setCreateRiskOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un risque
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Description</TableHead>
                    <TableHead>Criticite</TableHead>
                    {canManageRisks ? <TableHead className="text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasValidProjectId ? (
                    <EmptyTableMessage
                      colSpan={canManageRisks ? 3 : 2}
                      message="Identifiant projet invalide pour charger les risques."
                    />
                  ) : isRisksLoading ? (
                    <RiskRowsSkeleton showActions={canManageRisks} />
                  ) : isRisksError ? (
                    <TableRow>
                      <TableCell colSpan={canManageRisks ? 3 : 2} className="py-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              Impossible de charger les risques.
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getRiskErrorMessage(
                                risksError,
                                "Impossible de charger les risques.",
                              )}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => void refetchRisks()}>
                            Reessayer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : risks.length > 0 ? (
                    risks.map((risk) => (
                      <TableRow key={risk.idRisque}>
                        <TableCell className="max-w-3xl whitespace-pre-wrap">
                          {risk.description || "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-sm",
                              risk.niveauCriticite === "CRITIQUE"
                                ? "font-medium text-destructive"
                                : "text-foreground",
                            )}
                          >
                            {formatCriticality(risk.niveauCriticite)}
                          </span>
                        </TableCell>
                        {canManageRisks ? (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={isRiskMutationPending}
                                onClick={() => handleEditRisk(risk)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                disabled={isRiskMutationPending}
                                onClick={() => handleDeleteRisk(risk)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableMessage
                      colSpan={canManageRisks ? 3 : 2}
                      message="Aucun risque enregistré pour ce projet."
                    />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pj">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Pièces jointes</CardTitle>
              {canEdit ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Ajouter une pièce jointe
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fichier</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasValidProjectId ? (
                    <EmptyTableMessage
                      colSpan={canEdit ? 3 : 2}
                      message="Identifiant projet invalide."
                    />
                  ) : isPiecesJointesLoading ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 3 : 2}>Chargement...</TableCell>
                    </TableRow>
                  ) : isPiecesJointesError ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 3 : 2}>
                        Impossible de charger les pièces jointes.
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void refetchPiecesJointes()}
                        >
                          Réessayer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : piecesJointes.length > 0 ? (
                    piecesJointes.map((attachment) => (
                      <TableRow key={attachment.idPieceJointe}>
                        <TableCell>{attachment.nomFichier}</TableCell>
                        <TableCell>{formatDate(attachment.dateAjout)}</TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadPieceJointe(attachment)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeletePieceJointe(attachment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableMessage
                      colSpan={canEdit ? 3 : 2}
                      message="Aucune pièce jointe rattachée."
                    />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardContent className="p-0">
              {isHistoriqueError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Impossible de charger l'historique de ce projet.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void refetchHistorique()}>
                    Reessayer
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Utilisateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isHistoriqueLoading ? (
                      Array.from({ length: 4 }, (_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-full max-w-md" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : historique.length > 0 ? (
                      historique.map((entry) => (
                        <TableRow key={entry.idHistoriqueModification}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatHistoriqueDate(entry.dateModification)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-medium">
                            {formatTypeAction(entry.typeAction)}
                          </TableCell>
                          <TableCell className="text-sm">{entry.description || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {entry.nomCompletUtilisateur || entry.emailUtilisateur || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyTableMessage colSpan={4} message="Aucun historique disponible." />
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canManageRisks ? (
        <>
          <RiskFormDialog
            open={createRiskOpen}
            title="Ajouter un risque"
            description="Renseignez la description et la criticite du risque."
            onOpenChange={setCreateRiskOpen}
            onClose={clearSelectedRisk}
            onSubmit={(values) => createRiskMutation.mutate(values)}
            isPending={createRiskMutation.isPending}
          />
          <RiskFormDialog
            open={editRiskOpen}
            title="Modifier le risque"
            description="Ajustez la description et la criticite du risque."
            risk={selectedRisk}
            onOpenChange={setEditRiskOpen}
            onClose={clearSelectedRisk}
            onSubmit={(values) => {
              if (!selectedRisk) {
                return;
              }

              updateRiskMutation.mutate({ riskId: selectedRisk.idRisque, values });
            }}
            isPending={updateRiskMutation.isPending}
          />
          <DeleteRiskDialog
            open={deleteRiskOpen}
            risk={selectedRisk}
            onOpenChange={setDeleteRiskOpen}
            onClose={clearSelectedRisk}
            onConfirm={(riskId) => deleteRiskMutation.mutate(riskId)}
            isPending={deleteRiskMutation.isPending}
          />
        </>
      ) : null}

      {canManageCosts ? (
        <>
          <CostFormDialog
            open={createCostOpen}
            title="Ajouter un coût"
            description="Renseignez le type, le montant et la date du coût."
            onOpenChange={setCreateCostOpen}
            onClose={clearSelectedCost}
            onSubmit={(values) => createCostMutation.mutate(values)}
            isPending={createCostMutation.isPending}
          />
          <CostFormDialog
            open={editCostOpen}
            title="Modifier le coût"
            description="Ajustez le type, le montant et la date du coût."
            cost={selectedCost}
            onOpenChange={setEditCostOpen}
            onClose={clearSelectedCost}
            onSubmit={(values) => {
              if (!selectedCost) {
                return;
              }

              updateCostMutation.mutate({ costId: selectedCost.idCout, values });
            }}
            isPending={updateCostMutation.isPending}
          />
          <DeleteCostDialog
            open={deleteCostOpen}
            cost={selectedCost}
            onOpenChange={setDeleteCostOpen}
            onClose={clearSelectedCost}
            onConfirm={(costId) => deleteCostMutation.mutate(costId)}
            isPending={deleteCostMutation.isPending}
          />
        </>
      ) : null}

      {canManageAssignments ? (
        <>
          <CreateAffectationDialog
            open={createAffectationOpen}
            onOpenChange={setCreateAffectationOpen}
            projectId={projectId}
            resources={availableResources}
            isResourcesLoading={isResourcesLoading}
            isResourcesError={isResourcesError}
            onRetryResources={() => void refetchResources()}
            onSubmit={(request) => createAffectationMutation.mutate(request)}
            isPending={createAffectationMutation.isPending}
          />
          <EditAffectationDialog
            open={editAffectationOpen}
            affectation={selectedAffectation}
            onOpenChange={setEditAffectationOpen}
            onClose={clearSelectedAffectation}
            onSubmit={(affectationId, request) =>
              updateAffectationMutation.mutate({ affectationId, request })
            }
            isPending={updateAffectationMutation.isPending}
          />
          <DeleteAffectationDialog
            open={deleteAffectationOpen}
            affectation={selectedAffectation}
            onOpenChange={setDeleteAffectationOpen}
            onClose={clearSelectedAffectation}
            onConfirm={(affectationId) => deleteAffectationMutation.mutate(affectationId)}
            isPending={deleteAffectationMutation.isPending}
          />
        </>
      ) : null}

      {project && (
        <UploadPieceJointeDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          projectId={Number(project.id)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
