import type { FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatProjectPriority,
  formatProjectStatus,
  getProjectPriorityValue,
  getProjectStatusValue,
  projectPriorityOptions,
  projectStatusOptions,
  type ProjectFormValues,
} from "@/services/projectService";
import type { SessionUser } from "@/services/sessionService";

interface ProjectFormProps {
  mode: "create" | "edit";
  values: ProjectFormValues;
  currentUser: SessionUser | null;
  submitError: string;
  validationErrors: string[];
  isPending: boolean;
  onChange: (field: keyof ProjectFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ProjectForm({
  mode,
  values,
  currentUser,
  submitError,
  validationErrors,
  isPending,
  onChange,
  onSubmit,
}: ProjectFormProps) {
  const title = mode === "create" ? "Nouveau projet" : "Modifier le projet";
  const description =
    mode === "create"
      ? "Renseignez les informations du projet a enregistrer dans le portefeuille."
      : "Mettez a jour les informations du projet dont vous etes responsable.";
  const statusValue = getProjectStatusValue(values.statut);
  const priorityValue = getProjectPriorityValue(values.priorite);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-xs text-muted-foreground">
              Responsable connecte:{" "}
              <span className="font-medium text-foreground">
                {currentUser ? `${currentUser.prenom} ${currentUser.nom}`.trim() : "Non determine"}
              </span>
            </p>
          </div>

          {(submitError || validationErrors.length > 0) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation impossible</AlertTitle>
              <AlertDescription className="space-y-1 whitespace-pre-line">
                {submitError ? <p>{submitError}</p> : null}
                {validationErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code projet</Label>
              <Input
                id="code"
                value={values.code}
                onChange={(event) => onChange("code", event.target.value)}
                placeholder="PRJ-2026-001"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intitule">Intitule</Label>
              <Input
                id="intitule"
                value={values.intitule}
                onChange={(event) => onChange("intitule", event.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.descriptif}
              onChange={(event) => onChange("descriptif", event.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={statusValue}
                onValueChange={(value) => onChange("statut", value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formatProjectStatus(statusValue)} />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorite</Label>
              <Select
                value={priorityValue}
                onValueChange={(value) => onChange("priorite", value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formatProjectPriority(priorityValue)} />
                </SelectTrigger>
                <SelectContent>
                  {projectPriorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetPrevisionnel">Budget previsionnel (MAD)</Label>
              <Input
                id="budgetPrevisionnel"
                type="number"
                min="0"
                step="0.01"
                value={values.budgetPrevisionnel}
                onChange={(event) => onChange("budgetPrevisionnel", event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avancement">Avancement (%)</Label>
              <Input
                id="avancement"
                type="number"
                min="0"
                max="100"
                step="1"
                value={values.pourcentageAvancement}
                onChange={(event) => onChange("pourcentageAvancement", event.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebutPrevue">Date debut prevue</Label>
              <Input
                id="dateDebutPrevue"
                type="date"
                value={values.dateDebutPrevue}
                onChange={(event) => onChange("dateDebutPrevue", event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFinPrevue">Date fin prevue</Label>
              <Input
                id="dateFinPrevue"
                type="date"
                value={values.dateFinPrevue}
                onChange={(event) => onChange("dateFinPrevue", event.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebutReelle">Date debut reelle</Label>
              <Input
                id="dateDebutReelle"
                type="date"
                value={values.dateDebutReelle}
                onChange={(event) => onChange("dateDebutReelle", event.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFinReelle">Date fin reelle</Label>
              <Input
                id="dateFinReelle"
                type="date"
                value={values.dateFinReelle}
                onChange={(event) => onChange("dateFinReelle", event.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === "create"
                  ? "Creation..."
                  : "Enregistrement..."
                : mode === "create"
                  ? "Creer le projet"
                  : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
