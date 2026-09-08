import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClientSession } from "@/hooks/use-client-session";
import {
  createRessource,
  deleteRessource,
  getRessourceErrorMessage,
  getRessources,
  updateRessource,
} from "@/services/ressourceService";
import type {
  CreateRessourceRequest,
  NatureRessource,
  Ressource,
  UpdateRessourceRequest,
} from "@/types/ressource";

export const Route = createFileRoute("/_app/ressources")({
  head: () => ({ meta: [{ title: "Ressources - ProjectPortfolio" }] }),
  component: RessourcesPage,
});

const natureOptions: Array<{ value: NatureRessource; label: string }> = [
  { value: "INTERNE", label: "Interne" },
  { value: "PRESTATAIRE", label: "Prestataire" },
];

function formatNature(nature: NatureRessource) {
  return natureOptions.find((option) => option.value === nature)?.label ?? nature;
}

function ResourceRowsSkeleton({ showActions }: { showActions: boolean }) {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
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

const initialResourceForm: CreateRessourceRequest = {
  nom: "",
  fonction: "",
  nature: "INTERNE",
};

function validateResourceForm(form: CreateRessourceRequest) {
  if (!form.nom.trim() || !form.fonction.trim() || !form.nature) {
    toast.error("Veuillez remplir tous les champs obligatoires.");
    return false;
  }

  return true;
}

function CreateResourceDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateRessourceRequest) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateRessourceRequest>(initialResourceForm);

  useEffect(() => {
    if (!open) {
      setForm(initialResourceForm);
    }
  }, [open]);

  function updateField<K extends keyof CreateRessourceRequest>(
    field: K,
    value: CreateRessourceRequest[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateResourceForm(form) || isPending) {
      return;
    }

    onSubmit({
      nom: form.nom.trim(),
      fonction: form.fonction.trim(),
      nature: form.nature,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle ressource</DialogTitle>
          <DialogDescription>Ajoutez une ressource au catalogue DTI.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-name">Nom</Label>
            <Input
              id="resource-name"
              value={form.nom}
              onChange={(event) => updateField("nom", event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-function">Fonction</Label>
            <Input
              id="resource-function"
              value={form.fonction}
              onChange={(event) => updateField("fonction", event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nature</Label>
            <Select
              value={form.nature}
              onValueChange={(value) => updateField("nature", value as NatureRessource)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une nature" />
              </SelectTrigger>
              <SelectContent>
                {natureOptions.map((option) => (
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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creation..." : "Creer la ressource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditResourceDialog({
  open,
  resource,
  onOpenChange,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  resource: Ressource | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (idRessource: number, request: UpdateRessourceRequest) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<UpdateRessourceRequest>(initialResourceForm);

  useEffect(() => {
    if (!resource) {
      setForm(initialResourceForm);
      return;
    }

    setForm({
      nom: resource.nom,
      fonction: resource.fonction,
      nature: resource.nature,
    });
  }, [resource]);

  function updateField<K extends keyof UpdateRessourceRequest>(
    field: K,
    value: UpdateRessourceRequest[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resource || !validateResourceForm(form) || isPending) {
      return;
    }

    onSubmit(resource.idRessource, {
      nom: form.nom.trim(),
      fonction: form.fonction.trim(),
      nature: form.nature,
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
          <DialogTitle>Modifier la ressource</DialogTitle>
          <DialogDescription>Mettez a jour les informations du catalogue.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-resource-name">Nom</Label>
            <Input
              id="edit-resource-name"
              value={form.nom}
              onChange={(event) => updateField("nom", event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-resource-function">Fonction</Label>
            <Input
              id="edit-resource-function"
              value={form.fonction}
              onChange={(event) => updateField("fonction", event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nature</Label>
            <Select
              value={form.nature}
              onValueChange={(value) => updateField("nature", value as NatureRessource)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une nature" />
              </SelectTrigger>
              <SelectContent>
                {natureOptions.map((option) => (
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
            <Button type="submit" disabled={isPending || !resource}>
              {isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteResourceDialog({
  open,
  resource,
  onOpenChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  resource: Ressource | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirm: (idRessource: number) => void;
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
          <AlertDialogTitle>Supprimer la ressource ?</AlertDialogTitle>
          <AlertDialogDescription>
            {resource
              ? `Cette action supprimera definitivement ${resource.nom}.`
              : "Cette action supprimera definitivement cette ressource."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !resource}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();

              if (!resource) {
                return;
              }

              onConfirm(resource.idRessource);
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RessourcesPage() {
  const queryClient = useQueryClient();
  const { currentUser, isSessionReady } = useClientSession();
  const [search, setSearch] = useState("");
  const [nature, setNature] = useState<"all" | NatureRessource>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Ressource | null>(null);
  const isAdmin = isSessionReady && currentUser?.role === "ROLE_ADMIN";
  const queryParams = {
    texte: search.trim() || undefined,
    nature: nature === "all" ? undefined : nature,
  };
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ressources", queryParams],
    queryFn: () => getRessources(queryParams),
  });
  const createMutation = useMutation({
    mutationFn: createRessource,
    onSuccess: async () => {
      toast.success("Ressource creee avec succes.");
      await queryClient.invalidateQueries({ queryKey: ["ressources"] });
      setCreateDialogOpen(false);
    },
    onError: (mutationError) => {
      toast.error(getRessourceErrorMessage(mutationError, "Impossible de creer la ressource."));
    },
  });
  const editMutation = useMutation({
    mutationFn: ({
      idRessource,
      request,
    }: {
      idRessource: number;
      request: UpdateRessourceRequest;
    }) => updateRessource(idRessource, request),
    onSuccess: async () => {
      toast.success("Ressource modifiee avec succes.");
      await queryClient.invalidateQueries({ queryKey: ["ressources"] });
      setEditDialogOpen(false);
      setSelectedResource(null);
    },
    onError: (mutationError) => {
      toast.error(getRessourceErrorMessage(mutationError, "Impossible de modifier la ressource."));
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteRessource,
    onSuccess: async () => {
      toast.success("Ressource supprimee avec succes.");
      await queryClient.invalidateQueries({ queryKey: ["ressources"] });
      setDeleteDialogOpen(false);
      setSelectedResource(null);
    },
    onError: (mutationError) => {
      toast.error(
        getRessourceErrorMessage(
          mutationError,
          "Impossible de supprimer la ressource. Verifiez qu'elle n'est pas deja affectee a un projet.",
        ),
      );
    },
  });
  const actionsDisabled =
    createMutation.isPending || editMutation.isPending || deleteMutation.isPending;

  function handleEditResource(resource: Ressource) {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  }

  function handleDeleteResource(resource: Ressource) {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  }

  function handleCloseResourceDialog() {
    setSelectedResource(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Ressources</h1>
          <p className="text-sm text-muted-foreground">Gestion du pool de ressources DTI.</p>
        </div>
        {isAdmin ? (
          <Button
            className="gap-2 bg-primary text-primary-foreground"
            onClick={() => setCreateDialogOpen(true)}
            disabled={actionsDisabled}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,22rem)_14rem_auto] sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une ressource..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={nature}
              onValueChange={(value: "all" | NatureRessource) => setNature(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes natures</SelectItem>
                {natureOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground">
              {isLoading ? "Chargement..." : `${rows.length} ressource(s) affichee(s)`}
            </p>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{getRessourceErrorMessage(error, "Impossible de charger les ressources.")}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nom</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Nature</TableHead>
                {isAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ResourceRowsSkeleton showActions={isAdmin} />
              ) : rows.length > 0 ? (
                rows.map((resource) => (
                  <TableRow key={resource.idRessource}>
                    <TableCell className="font-medium">{resource.nom}</TableCell>
                    <TableCell>{resource.fonction}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatNature(resource.nature)}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={actionsDisabled}
                            onClick={() => handleEditResource(resource)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={actionsDisabled}
                            onClick={() => handleDeleteResource(resource)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 4 : 3}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Aucune ressource ne correspond aux criteres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <CreateResourceDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={(request) => createMutation.mutate(request)}
            isPending={createMutation.isPending}
          />
          <EditResourceDialog
            open={editDialogOpen}
            resource={selectedResource}
            onOpenChange={setEditDialogOpen}
            onClose={handleCloseResourceDialog}
            onSubmit={(idRessource, request) => editMutation.mutate({ idRessource, request })}
            isPending={editMutation.isPending}
          />
          <DeleteResourceDialog
            open={deleteDialogOpen}
            resource={selectedResource}
            onOpenChange={setDeleteDialogOpen}
            onClose={handleCloseResourceDialog}
            onConfirm={(idRessource) => deleteMutation.mutate(idRessource)}
            isPending={deleteMutation.isPending}
          />
        </>
      ) : null}
    </div>
  );
}
