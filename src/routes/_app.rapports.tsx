import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  exportReportExcel,
  getReport,
  getReportErrorMessage,
  type ReportProjectRowResponse,
} from "@/services/reportService";
import { formatMad } from "@/services/projectService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rapports")({
  head: () => ({ meta: [{ title: "Rapports — ProjectPortfolio" }] }),
  component: RapportsPage,
});

const STATUS_ITEMS = [
  { key: "PLANIFIE", label: "Planifié", color: "#64748B" },
  { key: "EN_COURS", label: "En cours", color: "#00A6C8" },
  { key: "TERMINE", label: "Terminé", color: "#22C55E" },
  { key: "EN_RETARD", label: "En retard", color: "#EF4444" },
  { key: "SUSPENDU", label: "Suspendu", color: "#F59E0B" },
  { key: "ANNULE", label: "Annulé", color: "#94A3B8" },
] as const;

const PRIORITY_ITEMS = [
  { key: "FAIBLE", label: "Faible", color: "#22C55E" },
  { key: "MOYENNE", label: "Moyenne", color: "#00A6C8" },
  { key: "ELEVEE", label: "Élevée", color: "#F59E0B" },
  { key: "CRITIQUE", label: "Critique", color: "#EF4444" },
] as const;

const COST_TYPE_LABELS: Record<string, string> = {
  MATERIEL: "Matériel",
  LOGICIEL: "Logiciel",
  PRESTATION: "Prestation",
  FORMATION: "Formation",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
};

const NATURE_LABELS: Record<string, string> = {
  DEVELOPPEMENT: "Développement",
  TEST: "Test",
  CONCEPTION: "Conception",
  GESTION_PROJET: "Gestion projet",
  SUPPORT: "Support",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
};

const CHART_COLORS = ["#0066A6", "#00A6C8", "#22C55E", "#F59E0B", "#EF4444", "#94A3B8", "#8B5CF6"];

function statusLabel(key: string) {
  return STATUS_ITEMS.find((s) => s.key === key)?.label ?? key;
}

function priorityLabel(key: string) {
  return PRIORITY_ITEMS.find((p) => p.key === key)?.label ?? key;
}

function statusColor(key: string) {
  return STATUS_ITEMS.find((s) => s.key === key)?.color ?? "#64748B";
}

function priorityColor(key: string) {
  return PRIORITY_ITEMS.find((p) => p.key === key)?.color ?? "#64748B";
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-md border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function RapportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}) {
  const toneClass = {
    default: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
  }[tone];

  return (
    <Card className="min-w-0 overflow-hidden border-border/60 shadow-sm transition hover:shadow-elegant">
      <CardContent className="p-4">
        <div className="min-w-0">
          <p className={cn("truncate text-xs font-semibold uppercase tracking-wide", toneClass)}>
            {label}
          </p>
          <p className="mt-1.5 break-words text-2xl font-bold text-foreground">{value}</p>
        </div>
        {helper ? <p className="mt-3 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function ProjectsTable({ projects }: { projects: ReportProjectRowResponse[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Aucun projet ne correspond aux critères sélectionnés.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Code</TableHead>
            <TableHead>Intitulé</TableHead>
            <TableHead className="whitespace-nowrap">Responsable</TableHead>
            <TableHead className="whitespace-nowrap">Statut</TableHead>
            <TableHead className="whitespace-nowrap">Priorité</TableHead>
            <TableHead className="whitespace-nowrap text-right">Budget prévu</TableHead>
            <TableHead className="whitespace-nowrap text-right">Coût consommé</TableHead>
            <TableHead className="whitespace-nowrap text-right">Écart</TableHead>
            <TableHead className="whitespace-nowrap">Avancement</TableHead>
            <TableHead className="whitespace-nowrap text-center">Risques critiques</TableHead>
            <TableHead className="whitespace-nowrap text-center">Ressources</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const isOverBudget = project.variance < 0;
            return (
              <TableRow key={project.projectId}>
                <TableCell className="whitespace-nowrap font-mono text-xs font-medium">
                  <Link
                    to="/projets/$id"
                    params={{ id: String(project.projectId) }}
                    className="text-primary hover:underline"
                  >
                    {project.code}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={project.intitule}>
                  {project.intitule}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {project.responsable || "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap text-sm",
                    project.statut === "TERMINE" ? "text-success font-medium" : "text-foreground",
                  )}
                >
                  {statusLabel(project.statut)}
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap text-sm",
                    project.priorite === "ELEVEE"
                      ? "text-destructive font-medium"
                      : "text-foreground",
                  )}
                >
                  {priorityLabel(project.priorite)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatMad(project.plannedBudget)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatMad(project.consumedCost)}
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap text-right tabular-nums font-medium",
                    isOverBudget ? "text-destructive" : "text-success",
                  )}
                >
                  {isOverBudget ? "" : "+"}
                  {formatMad(project.variance)}
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress ?? 0} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {project.progress ?? 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {project.criticalRiskCount > 0 ? (
                    <span className="text-xs font-medium text-destructive">
                      {project.criticalRiskCount}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {project.resourceCount}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RapportsPage() {
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPriorite, setFilterPriorite] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const reportQuery = useQuery({
    queryKey: ["report"],
    queryFn: getReport,
  });

  const report = reportQuery.data;

  const filteredProjects = useMemo(() => {
    if (!report) return [];
    return report.projects.filter(
      (p) =>
        (filterStatut === "all" || p.statut === filterStatut) &&
        (filterPriorite === "all" || p.priorite === filterPriorite),
    );
  }, [report, filterStatut, filterPriorite]);

  const filteredKpis = useMemo(() => {
    const projects = filteredProjects;
    const totalPlanned = projects.reduce((s, p) => s + p.plannedBudget, 0);
    const totalConsumed = projects.reduce((s, p) => s + p.consumedCost, 0);
    const avgProgress = projects.length
      ? Math.round(projects.reduce((s, p) => s + (p.progress ?? 0), 0) / projects.length)
      : 0;
    const criticalRisks = projects.reduce((s, p) => s + p.criticalRiskCount, 0);
    return {
      totalPlanned,
      totalConsumed,
      variance: totalPlanned - totalConsumed,
      avgProgress,
      criticalRisks,
    };
  }, [filteredProjects]);

  const statusChartData = useMemo(
    () =>
      (report?.projectsByStatus ?? []).map((item) => ({
        key: item.key,
        name: statusLabel(item.key),
        value: item.count,
        fill: statusColor(item.key),
      })),
    [report?.projectsByStatus],
  );

  const priorityChartData = useMemo(
    () =>
      (report?.projectsByPriority ?? []).map((item) => ({
        key: item.key,
        name: priorityLabel(item.key),
        value: item.count,
        fill: priorityColor(item.key),
      })),
    [report?.projectsByPriority],
  );

  const budgetByStatusData = useMemo(
    () =>
      (report?.budgetByStatus ?? []).map((item) => ({
        name: statusLabel(item.statut),
        "Budget prévu": item.totalPlannedBudget,
        Projets: item.projectCount,
      })),
    [report?.budgetByStatus],
  );

  const costByTypeData = useMemo(
    () =>
      (report?.costByType ?? []).map((item, i) => ({
        name: COST_TYPE_LABELS[item.type] ?? item.type,
        "Total (MAD)": item.totalMontant,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [report?.costByType],
  );

  const resourceData = useMemo(
    () =>
      (report?.resourceAllocationByNature ?? []).map((item, i) => ({
        name: NATURE_LABELS[item.natureIntervention] ?? item.natureIntervention,
        "Charge JH": Number(item.totalChargeJH),
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [report?.resourceAllocationByNature],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReportExcel();
      toast.success("Export Excel généré avec succès.");
    } catch {
      toast.error("Impossible de générer l'export Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  if (reportQuery.isLoading) {
    return <RapportsSkeleton />;
  }

  if (reportQuery.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports & exports</h1>
          <p className="text-sm text-muted-foreground">
            Synthèse et analyses du portefeuille projets DTI.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impossible de charger le rapport</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              {getReportErrorMessage(
                reportQuery.error,
                "Une erreur est survenue pendant le chargement du rapport.",
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void reportQuery.refetch()}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) return null;

  const globalVarianceTone: "destructive" | "success" =
    report.kpis.totalBudgetVariance < 0 ? "destructive" : "success";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports & exports</h1>
          <p className="text-sm text-muted-foreground">
            Synthèse et analyses du portefeuille projets DTI.
          </p>
        </div>
        <Button
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="shrink-0 gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Génération…" : "Exporter Excel"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard label="Total projets" value={report.kpis.totalProjects} />
        <KpiCard label="Budget planifié" value={formatMad(report.kpis.totalPlannedBudget)} />
        <KpiCard
          label="Coût consommé"
          value={formatMad(report.kpis.totalConsumedCost)}
          tone="info"
        />
        <KpiCard
          label="Écart global"
          value={formatMad(report.kpis.totalBudgetVariance)}
          helper={report.kpis.totalBudgetVariance < 0 ? "Dépassement" : "Budget restant"}
          tone={globalVarianceTone}
        />
        <KpiCard
          label="Avancement moyen"
          value={`${report.kpis.averageProgress}%`}
          tone="default"
        />
        <KpiCard
          label="Risques critiques"
          value={report.kpis.totalCriticalRisks}
          tone={report.kpis.totalCriticalRisks > 0 ? "warning" : "default"}
        />
        <KpiCard label="Affectations" value={report.kpis.totalResourceAllocations} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="budget">Budget & Coûts</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="projects">Projets ({report.projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition par statut</CardTitle>
                <CardDescription>
                  Nombre de projets dans chaque statut opérationnel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {statusChartData.map((item) => (
                          <Cell key={item.key} fill={item.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [Number(value).toLocaleString("fr-FR"), name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState label="Aucun projet à afficher." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition par priorité</CardTitle>
                <CardDescription>Distribution des projets par niveau de priorité.</CardDescription>
              </CardHeader>
              <CardContent>
                {priorityChartData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={priorityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip
                        formatter={(value, name) => [Number(value).toLocaleString("fr-FR"), name]}
                      />
                      <Bar dataKey="value" name="Projets" radius={[6, 6, 0, 0]}>
                        {priorityChartData.map((item) => (
                          <Cell key={item.key} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState label="Aucun projet à afficher." />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget planifié par statut</CardTitle>
              <CardDescription>
                Montant total du budget prévisionnel regroupé par statut de projet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgetByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={budgetByStatusData}
                    margin={{ top: 8, right: 20, bottom: 8, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatMad(Number(v))}
                      width={100}
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === "Budget prévu" ? formatMad(Number(value)) : value,
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="Budget prévu" fill="#0066A6" radius={[6, 6, 0, 0]}>
                      {budgetByStatusData.map((item, i) => (
                        <Cell
                          key={i}
                          fill={STATUS_ITEMS.find((s) => s.label === item.name)?.color ?? "#0066A6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState label="Aucune donnée budgétaire disponible." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coûts par type</CardTitle>
              <CardDescription>
                Répartition des dépenses enregistrées par catégorie de coût.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costByTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={costByTypeData}
                    margin={{ top: 8, right: 20, bottom: 8, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatMad(Number(v))}
                      width={100}
                    />
                    <RechartsTooltip
                      formatter={(value) => [formatMad(Number(value)), "Total (MAD)"]}
                    />
                    <Bar dataKey="Total (MAD)" radius={[6, 6, 0, 0]}>
                      {costByTypeData.map((item, i) => (
                        <Cell key={i} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState label="Aucun coût enregistré." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Charge par nature d'intervention</CardTitle>
              <CardDescription>
                Total des jours-hommes affectés par type d'intervention sur le portefeuille.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={resourceData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString("fr-FR")} JH`,
                        "Charge totale",
                      ]}
                    />
                    <Bar dataKey="Charge JH" name="Charge totale (JH)" radius={[6, 6, 0, 0]}>
                      {resourceData.map((item, i) => (
                        <Cell key={i} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState label="Aucune affectation de ressource enregistrée." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Filtres</CardTitle>
                  <CardDescription>Affiner la liste et les indicateurs ci-dessous.</CardDescription>
                </div>
                {(filterStatut !== "all" || filterPriorite !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterStatut("all");
                      setFilterPriorite("all");
                    }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Tous statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {STATUS_ITEMS.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPriorite} onValueChange={setFilterPriorite}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Toutes priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    {PRIORITY_ITEMS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Projets
                </p>
                <p className="mt-1.5 text-2xl font-bold">{filteredProjects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Budget prévu
                </p>
                <p className="mt-1.5 text-2xl font-bold">{formatMad(filteredKpis.totalPlanned)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Coût consommé
                </p>
                <p className="mt-1.5 text-2xl font-bold">{formatMad(filteredKpis.totalConsumed)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Avancement moyen
                </p>
                <p className="mt-1.5 text-2xl font-bold">{filteredKpis.avgProgress}%</p>
              </CardContent>
            </Card>
          </div>

          <ProjectsTable projects={filteredProjects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
