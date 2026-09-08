import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type DashboardAttentionReason,
  type DashboardBudgetProjectResponse,
  type DashboardCountItemResponse,
  getDashboard,
  getDashboardErrorMessage,
} from "@/services/dashboardService";
import { formatDate, formatMad } from "@/services/projectService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - ProjectPortfolio" }] }),
  component: DashboardPage,
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

const RISK_ITEMS = [
  { key: "FAIBLE", label: "Faible", color: "#22C55E" },
  { key: "MOYEN", label: "Moyen", color: "#F59E0B" },
  { key: "ELEVE", label: "Élevé", color: "#F97316" },
  { key: "CRITIQUE", label: "Critique", color: "#EF4444" },
] as const;

const REASON_LABELS: Record<DashboardAttentionReason, string> = {
  DELAYED: "En retard",
  BUDGET_OVERRUN: "Dépassement budgétaire",
  CRITICAL_RISK: "Risque critique",
};

const REASON_CLASSES: Record<DashboardAttentionReason, string> = {
  DELAYED: "text-destructive",
  BUDGET_OVERRUN: "text-warning",
  CRITICAL_RISK: "text-destructive",
};

type DistributionItem = {
  key: string;
  name: string;
  value: number;
  fill: string;
};

type BudgetChartItem = DashboardBudgetProjectResponse & {
  name: string;
  "Budget prévisionnel": number;
  "Coût consommé": number;
};

function mapCounts<T extends readonly { key: string; label: string; color: string }[]>(
  source: DashboardCountItemResponse[],
  definitions: T,
): DistributionItem[] {
  const counts = new Map(source.map((item) => [item.key, item.count]));

  return definitions.map((item) => ({
    key: item.key,
    name: item.label,
    value: counts.get(item.key) ?? 0,
    fill: item.color,
  }));
}

function hasAnyCount(items: DistributionItem[]) {
  return items.some((item) => item.value > 0);
}

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <Card key={index} className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
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
    <Card className="overflow-hidden border-border/60 shadow-sm transition hover:shadow-elegant">
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

function DistributionPieChart({ data }: { data: DistributionItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
        >
          {data.map((item) => (
            <Cell key={item.key} fill={item.fill} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value, name) => [Number(value).toLocaleString("fr-FR"), name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function DistributionBarChart({ data }: { data: DistributionItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <RechartsTooltip
          formatter={(value, name) => [Number(value).toLocaleString("fr-FR"), name]}
        />
        <Bar dataKey="value" name="Projets" radius={[6, 6, 0, 0]}>
          {data.map((item) => (
            <Cell key={item.key} fill={item.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BudgetChart({ data }: { data: BudgetChartItem[] }) {
  const minWidth = Math.max(760, data.length * 96);

  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ minWidth }} className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatMad(Number(value))} />
            <RechartsTooltip
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as BudgetChartItem | undefined;
                return item ? `${item.code} - ${item.intitule}` : "";
              }}
              formatter={(value, name, item) => {
                const payload = item.payload as BudgetChartItem | undefined;
                const variance =
                  name === "Coût consommé" && payload
                    ? ` | Écart: ${formatMad(payload.variance)}`
                    : "";
                return [`${formatMad(Number(value))}${variance}`, name];
              }}
            />
            <Legend />
            <Bar dataKey="Budget prévisionnel" fill="#0066A6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Coût consommé" fill="#00A6C8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AttentionReasonBadge({ reason }: { reason: DashboardAttentionReason }) {
  return (
    <span className={cn("shrink-0 text-xs font-medium", REASON_CLASSES[reason])}>
      {REASON_LABELS[reason]}
    </span>
  );
}

function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const dashboard = dashboardQuery.data;

  const statusData = useMemo(
    () => mapCounts(dashboard?.projectsByStatus ?? [], STATUS_ITEMS),
    [dashboard?.projectsByStatus],
  );
  const priorityData = useMemo(
    () => mapCounts(dashboard?.projectsByPriority ?? [], PRIORITY_ITEMS),
    [dashboard?.projectsByPriority],
  );
  const riskData = useMemo(
    () => mapCounts(dashboard?.risksByCriticality ?? [], RISK_ITEMS),
    [dashboard?.risksByCriticality],
  );
  const budgetData = useMemo<BudgetChartItem[]>(
    () =>
      (dashboard?.budgetVsConsumedByProject ?? []).map((project) => ({
        ...project,
        name: project.code,
        "Budget prévisionnel": project.plannedBudget,
        "Coût consommé": project.consumedCost,
      })),
    [dashboard?.budgetVsConsumedByProject],
  );

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Vue synthétique du portefeuille projets DTI.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impossible de charger le tableau de bord</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              {getDashboardErrorMessage(
                dashboardQuery.error,
                "Une erreur est survenue pendant le chargement du tableau de bord.",
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void dashboardQuery.refetch()}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const varianceTone: "destructive" | "success" =
    dashboard.kpis.globalBudgetVariance < 0 ? "destructive" : "success";
  const varianceHelper =
    dashboard.kpis.globalBudgetVariance < 0
      ? "Dépassement global"
      : dashboard.kpis.globalBudgetVariance === 0
        ? "Budget entièrement consommé"
        : "Budget restant";

  const kpis = [
    {
      label: "Total projets",
      value: dashboard.kpis.totalProjects,
      tone: "default" as const,
    },
    {
      label: "Planifiés",
      value: dashboard.kpis.plannedProjects,
      tone: "default" as const,
    },
    {
      label: "En cours",
      value: dashboard.kpis.projectsInProgress,
      tone: "info" as const,
    },
    {
      label: "Terminés",
      value: dashboard.kpis.completedProjects,
      tone: "success" as const,
    },
    {
      label: "En retard",
      value: dashboard.kpis.delayedProjects,
      tone: dashboard.kpis.delayedProjects > 0 ? ("destructive" as const) : ("default" as const),
    },
    {
      label: "Budget prévisionnel total",
      value: formatMad(dashboard.kpis.totalPlannedBudget),
      tone: "default" as const,
    },
    {
      label: "Coût total consommé",
      value: formatMad(dashboard.kpis.totalConsumedCost),
      tone: "info" as const,
    },
    {
      label: "Écart budgétaire global",
      value: formatMad(dashboard.kpis.globalBudgetVariance),
      helper: varianceHelper,
      tone: varianceTone,
    },
    {
      label: "Risques critiques",
      value: dashboard.kpis.criticalRisks,
      tone: dashboard.kpis.criticalRisks > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Vue synthétique du portefeuille projets DTI.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((item) => (
            <KpiCard key={item.label} {...item} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par statut</CardTitle>
              <CardDescription>Nombre de projets par statut opérationnel.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasAnyCount(statusData) ? (
                <DistributionPieChart data={statusData} />
              ) : (
                <EmptyChartState label="Aucun projet à afficher par statut." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par priorité</CardTitle>
              <CardDescription>Distribution des projets par niveau de priorité.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasAnyCount(priorityData) ? (
                <DistributionBarChart data={priorityData} />
              ) : (
                <EmptyChartState label="Aucun projet à afficher par priorité." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi budgétaire par projet</CardTitle>
            <CardDescription>
              Comparaison entre budget prévisionnel et coût consommé, dans l'ordre fourni par l'API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetData.length > 0 ? (
              <BudgetChart data={budgetData} />
            ) : (
              <EmptyChartState label="Aucune donnée budgétaire à afficher." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risques par niveau de criticité</CardTitle>
            <CardDescription>
              Répartition des enregistrements de risques par criticité.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnyCount(riskData) ? (
              <DistributionBarChart data={riskData} />
            ) : (
              <EmptyChartState label="Aucun risque à afficher par criticité." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Projets nécessitant une attention particulière
            </CardTitle>
            <CardDescription>
              Liste fournie par le backend selon les conditions de surveillance du portefeuille.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.projectsRequiringAttention.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                Aucun projet ne nécessite une attention particulière.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.projectsRequiringAttention.map((project) => (
                  <Link
                    key={project.projectId}
                    to="/projets/$id"
                    params={{ id: String(project.projectId) }}
                    className="block rounded-lg border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-elegant"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{project.code}</Badge>
                          {project.reasons.map((reason) => (
                            <AttentionReasonBadge key={reason} reason={reason} />
                          ))}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                              {project.intitule}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent>{project.intitule}</TooltipContent>
                        </Tooltip>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {STATUS_ITEMS.find((item) => item.key === project.statut)?.label ??
                              project.statut}
                          </Badge>
                          <Badge variant="outline">
                            {PRIORITY_ITEMS.find((item) => item.key === project.priorite)?.label ??
                              project.priorite}
                          </Badge>
                          <Badge variant="secondary">{project.pourcentageAvancement}%</Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-3">
                        <Metric label="Fin prévue" value={formatDate(project.dateFinPrevue)} />
                        <Metric label="Budget prévu" value={formatMad(project.plannedBudget)} />
                        <Metric label="Coût consommé" value={formatMad(project.consumedCost)} />
                        <Metric
                          label="Écart budget"
                          value={formatMad(project.budgetVariance)}
                          negative={project.budgetVariance < 0}
                        />
                        <Metric label="Risques critiques" value={project.criticalRiskCount} />
                        <Metric label="Avancement" value={`${project.pourcentageAvancement}%`} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function Metric({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: string | number;
  negative?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md bg-muted/30 p-3">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-semibold text-foreground",
          negative && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
