import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Filter, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  deleteProject,
  exportProjectsExcel,
  formatMad,
  formatProjectPriority,
  formatProjectStatus,
  getProjects,
  getProjectErrorMessage,
  isOwnedProject,
  projectPriorityOptions,
  projectRiskOptions,
  projectStatusOptions,
  type Project,
} from "@/services/projectService";
import { useClientSession } from "@/hooks/use-client-session";
import { Route as ProjectCreateRoute } from "./_app.projets.new";
import { Route as ProjectEditRoute } from "./_app.projets.$id.edit";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projets")({
  head: () => ({ meta: [{ title: "Projets - ProjectPortfolio" }] }),
  component: ProjectsPage,
});

type ResponsableOption = {
  id: string;
  label: string;
};

function ProjectRowsSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  ));
}

function ProjectsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const { currentUser, isSessionReady } = useClientSession();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const canCreate = isSessionReady && currentUser?.role === "ROLE_RESPONSABLE_PROJET";
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("all");
  const [priorite, setPriorite] = useState("all");
  const [niveauRisque, setNiveauRisque] = useState("all");
  const [responsable, setResponsable] = useState("all");
  const [ownership, setOwnership] = useState<"all" | "mine">("all");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [responsableOptions, setResponsableOptions] = useState<ResponsableOption[]>([]);
  const hasActiveFilters =
    search.trim() !== "" ||
    statut !== "all" ||
    priorite !== "all" ||
    niveauRisque !== "all" ||
    responsable !== "all" ||
    ownership !== "all";
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);
  const backendFilters = useMemo(
    () => ({
      search: debouncedSearch,
      statut,
      priorite,
      niveauRisque,
      responsable: "all",
      ownership,
      responsableId: responsable !== "all" ? responsable : undefined,
    }),
    [debouncedSearch, niveauRisque, ownership, priorite, responsable, statut],
  );
  const {
    data: projects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", backendFilters, currentUser?.email ?? ""],
    queryFn: () => getProjects(backendFilters, currentUser),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      toast.success("Projet supprime avec succes.");
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectToDelete(null);
    },
    onError: (mutationError) => {
      toast.error(getProjectErrorMessage(mutationError, "Impossible de supprimer le projet."));
    },
  });
  const exportMutation = useMutation({
    mutationFn: () => exportProjectsExcel(backendFilters, currentUser),
    onSuccess: (filename) => {
      toast.success(`Export Excel telecharge : ${filename}`);
    },
    onError: (exportError) => {
      toast.error(getProjectErrorMessage(exportError, "Impossible d'exporter les projets."));
    },
  });

  const filteredProjects = projects;

  useEffect(() => {
    setResponsableOptions((currentOptions) => {
      const optionsById = new Map(currentOptions.map((option) => [option.id, option]));

      projects.forEach((project) => {
        const id = project.responsable?.id?.trim();
        const label = project.responsable?.fullName || project.responsable?.email || "";

        if (id && label) {
          optionsById.set(id, { id, label });
        }
      });

      const nextOptions = Array.from(optionsById.values()).sort((left, right) =>
        left.label.localeCompare(right.label, "fr"),
      );
      const isUnchanged =
        nextOptions.length === currentOptions.length &&
        nextOptions.every(
          (option, index) =>
            option.id === currentOptions[index]?.id &&
            option.label === currentOptions[index]?.label,
        );

      return isUnchanged ? currentOptions : nextOptions;
    });
  }, [projects]);

  function restoreFilters() {
    setSearch("");
    setStatut("all");
    setPriorite("all");
    setNiveauRisque("all");
    setResponsable("all");
    setOwnership("all");
  }

  if (pathname !== Route.to) {
    return <Outlet />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Portefeuille projets</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Chargement des projets..."
              : `${filteredProjects.length} projet(s) affiche(s) sur ${projects.length}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => exportMutation.mutate()}
            disabled={isLoading || exportMutation.isPending || filteredProjects.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {exportMutation.isPending ? "Export..." : "Exporter"}
            </span>
          </Button>
          {canCreate ? (
            <Button asChild className="gap-2 bg-primary text-primary-foreground">
              <Link to={ProjectCreateRoute.to}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau projet</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Code, intitule, responsable..."
              />
            </div>

            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {projectStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorite} onValueChange={setPriorite}>
              <SelectTrigger>
                <SelectValue placeholder="Priorite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorites</SelectItem>
                {projectPriorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={niveauRisque} onValueChange={setNiveauRisque}>
              <SelectTrigger>
                <SelectValue placeholder="Risque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous risques</SelectItem>
                {projectRiskOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={responsable} onValueChange={setResponsable}>
              <SelectTrigger>
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous responsables</SelectItem>
                {responsableOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            {canCreate ? (
              <Select
                value={ownership}
                onValueChange={(value: "all" | "mine") => setOwnership(value)}
              >
                <SelectTrigger className="h-8 w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  <SelectItem value="mine">Mes projets uniquement</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span>Filtres multicriteres actifs</span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={restoreFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Chargement impossible</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{getProjectErrorMessage(error, "Impossible de charger les projets.")}</p>
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
                <TableHead>Code</TableHead>
                <TableHead>Intitule</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorite</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="min-w-35">Avancement</TableHead>
                <TableHead>Fin prevue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ProjectRowsSkeleton />
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const canEdit = canCreate && isOwnedProject(project, currentUser);
                  const canDelete = canEdit;

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-mono text-xs">{project.code || "-"}</TableCell>
                      <TableCell className="font-medium">{project.intitule || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {project.responsable?.fullName || project.responsable?.email || "-"}
                      </TableCell>
                      <TableCell>{formatProjectStatus(project.statut)}</TableCell>
                      <TableCell>{formatProjectPriority(project.priorite)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMad(project.budgetPrevisionnel)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.avancement} className="h-2" />
                          <span className="w-9 text-right text-xs text-muted-foreground">
                            {project.avancement}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {project.dateFinPrevue || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                            <Link to="/projets/$id" params={{ id: project.id }}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canEdit ? (
                            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                              <Link to={ProjectEditRoute.to} params={{ id: project.id }}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() => setProjectToDelete(project)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Aucun projet ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(projectToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setProjectToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              {projectToDelete
                ? `Cette action supprimera definitivement ${projectToDelete.intitule}.`
                : "Cette action supprimera definitivement ce projet."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending || !projectToDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!projectToDelete) {
                  return;
                }
                deleteMutation.mutate(projectToDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
