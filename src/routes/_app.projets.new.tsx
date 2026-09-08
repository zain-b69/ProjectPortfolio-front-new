import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  createProject,
  getProjectFormValues,
  getProjectErrorMessage,
  normalizeProjectFormValues,
  validateProjectForm,
  type ProjectFormValues,
} from "@/services/projectService";
import { isProjectManager } from "@/services/sessionService";
import { useClientSession } from "@/hooks/use-client-session";

export const Route = createFileRoute("/_app/projets/new")({
  head: () => ({ meta: [{ title: "Nouveau projet - ProjectPortfolio" }] }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isSessionReady } = useClientSession();
  const [values, setValues] = useState<ProjectFormValues>(getProjectFormValues());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");

  const mutation = useMutation({
    mutationFn: (nextValues: ProjectFormValues) => createProject(nextValues),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await navigate({ to: "/projets/$id", params: { id: project.id } });
    },
    onError: (error) => {
      setSubmitError(getProjectErrorMessage(error, "Impossible de creer le projet."));
    },
  });

  if (!isSessionReady) {
    return <div className="p-4 text-sm text-muted-foreground">Chargement de la session...</div>;
  }

  if (!currentUser || !isProjectManager(currentUser)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Acces refuse</AlertTitle>
        <AlertDescription>Seul un responsable projet peut creer un projet.</AlertDescription>
      </Alert>
    );
  }

  function handleChange(field: keyof ProjectFormValues, value: string) {
    setSubmitError("");
    setValidationErrors([]);
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateProjectForm(values);
    setValidationErrors(errors);
    setSubmitError("");

    if (errors.length > 0) {
      return;
    }

    const normalizedValues = normalizeProjectFormValues(values);
    setValues(normalizedValues);
    mutation.mutate(normalizedValues);
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/projets">
          <ArrowLeft className="h-4 w-4" />
          Retour aux projets
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Creer un projet</h1>
        <p className="text-sm text-muted-foreground">
          Le projet sera cree sous votre responsabilite.
        </p>
      </div>

      <ProjectForm
        mode="create"
        values={values}
        currentUser={currentUser}
        submitError={submitError}
        validationErrors={validationErrors}
        isPending={mutation.isPending}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
