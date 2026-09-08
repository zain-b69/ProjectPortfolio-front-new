import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatHistoriqueDate,
  formatTypeAction,
  getHistorique,
  getHistoriqueErrorMessage,
  typeActionOptions,
  type HistoriqueFilters,
  type TypeAction,
} from "@/services/historiqueService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/historique")({
  head: () => ({ meta: [{ title: "Historique — ProjectPortfolio" }] }),
  component: HistoryPage,
});

const PAGE_SIZE = 20;

function TypeActionBadge({ typeAction }: { typeAction: TypeAction | null }) {
  if (!typeAction) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <span className="text-sm font-medium text-foreground">{formatTypeAction(typeAction)}</span>
  );
}

function HistoryRowsSkeleton() {
  return Array.from({ length: 8 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 5 }, (_, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-4 w-full max-w-[160px]" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function HistoryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<HistoriqueFilters>({ typeAction: "all" });
  const [page, setPage] = useState(0);

  const historiqueQuery = useQuery({
    queryKey: ["historique", filters, page],
    queryFn: () => getHistorique(filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const data = historiqueQuery.data;
  const entries = data?.content ?? [];
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.typeAction ?? "all") !== "all" ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  function applySearch() {
    setPage(0);
    setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }));
  }

  function updateFilter(key: keyof HistoriqueFilters, value: string | undefined) {
    setPage(0);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setSearchInput("");
    setPage(0);
    setFilters({ typeAction: "all" });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique des modifications</h1>
        <p className="text-sm text-muted-foreground">
          Journal d'audit complet des actions sur le portefeuille projets DTI.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Filtres</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-1.5", !hasActiveFilters && "invisible")}
            tabIndex={hasActiveFilters ? undefined : -1}
            onClick={resetFilters}
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid items-center gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applySearch();
                  }
                }}
                placeholder="Rechercher (description, utilisateur)…"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={applySearch}
                aria-label="Rechercher"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={filters.typeAction ?? "all"}
              onValueChange={(value) => updateFilter("typeAction", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {typeActionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                Du
              </span>
              <Input
                type="date"
                aria-label="Date de début"
                value={filters.dateFrom ?? ""}
                onChange={(event) => updateFilter("dateFrom", event.target.value || undefined)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                Au
              </span>
              <Input
                type="date"
                aria-label="Date de fin"
                value={filters.dateTo ?? ""}
                onChange={(event) => updateFilter("dateTo", event.target.value || undefined)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {historiqueQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impossible de charger l'historique</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {getHistoriqueErrorMessage(
                historiqueQuery.error,
                "Une erreur est survenue pendant le chargement de l'historique.",
              )}
            </p>
            <Button variant="outline" size="sm" onClick={() => void historiqueQuery.refetch()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="whitespace-nowrap">Projet</TableHead>
                    <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historiqueQuery.isLoading ? (
                    <HistoryRowsSkeleton />
                  ) : entries.length > 0 ? (
                    entries.map((entry) => (
                      <TableRow key={entry.idHistoriqueModification}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatHistoriqueDate(entry.dateModification)}
                        </TableCell>
                        <TableCell>
                          <TypeActionBadge typeAction={entry.typeAction} />
                        </TableCell>
                        <TableCell className="max-w-[420px] text-sm">
                          {entry.description || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entry.idProjet ? (
                            <Link
                              to="/projets/$id"
                              params={{ id: String(entry.idProjet) }}
                              className="font-medium text-primary hover:underline"
                            >
                              {entry.codeProjet || `#${entry.idProjet}`}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {entry.nomCompletUtilisateur || entry.emailUtilisateur || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        {hasActiveFilters
                          ? "Aucune action ne correspond aux filtres sélectionnés."
                          : "Aucune action enregistrée pour le moment."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {data && data.totalElements > 0 ? (
              <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Page {data.page + 1} sur {Math.max(data.totalPages, 1)} · {data.totalElements}{" "}
                  action(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={data.first || historiqueQuery.isFetching}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={data.last || historiqueQuery.isFetching}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
