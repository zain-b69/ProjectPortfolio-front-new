import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getProject,
  getProjectErrorMessage,
  getProjectFormValues,
  isOwnedProject,
  normalizeProjectFormValues,
  updateProject,
  validateProjectForm,
  type ProjectFormValues,
} from "@/services/projectService";
import { isProjectManager } from "@/services/sessionService";
import { useClientSession } from "@/hooks/use-client-session";

export const Route = createFileRoute("/_app/projets/$id/edit")({
  head: () => ({ meta: [{ title: "Modifier projet - ProjectPortfolio" }] }),
  component: EditProjectPage,
});

function EditProjectPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isSessionReady } = useClientSession();
  const [values, setValues] = useState<ProjectFormValues>(getProjectFormValues());
  const [initializedProjectId, setInitializedProjectId] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
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

  const mutation = useMutation({
    mutationFn: (nextValues: ProjectFormValues) => updateProject(id, nextValues),
    onSuccess: async (updatedProject) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["projects", id] });
      await navigate({ to: "/projets/$id", params: { id: updatedProject.id } });
    },
    onError: (mutationError) => {
      setSubmitError(getProjectErrorMessage(mutationError, "Impossible de modifier le projet."));
    },
  });

  useEffect(() => {
    if (project) {
      setValues(getProjectFormValues(project));
      setInitializedProjectId(project.id || id);
    }
  }, [id, project]);

  if (!isSessionReady) {
    return <div className="p-4 text-sm text-muted-foreground">Chargement de la session...</div>;
  }

  if (!currentUser || !isProjectManager(currentUser)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Acces refuse</AlertTitle>
        <AlertDescription>Seul un responsable projet peut modifier un projet.</AlertDescription>
      </Alert>
    );
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

  if (initializedProjectId !== (project.id || id)) {
    return <div className="p-4 text-sm text-muted-foreground">Initialisation du formulaire...</div>;
  }

  if (!isOwnedProject(project, currentUser)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Modification interdite</AlertTitle>
        <AlertDescription>
          Vous pouvez uniquement modifier les projets dont vous etes le responsable.
        </AlertDescription>
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
        <Link to="/projets/$id" params={{ id }}>
          <ArrowLeft className="h-4 w-4" />
          Retour au detail
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modifier le projet</h1>
        <p className="text-sm text-muted-foreground">
          Les modifications sont limitees au projet dont vous avez la charge.
        </p>
      </div>

      <ProjectForm
        mode="edit"
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
