import axios from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useClientSession } from "@/hooks/use-client-session";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type AppUser,
  type CreateUtilisateurRequest,
  type UpdateUtilisateurRequest,
  type UserRole,
} from "@/services/userService";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/utilisateurs")({
  head: () => ({ meta: [{ title: "Utilisateurs — ProjectPortfolio" }] }),
  component: UsersPage,
});

const roleLabel: Record<string, string> = {
  ROLE_ADMIN: "Administrateur",
  ROLE_RESPONSABLE_PROJET: "Responsable projet",
  ROLE_UTILISATEUR_SIMPLE: "Utilisateur simple",
};

const roleStyle: Record<string, string> = {
  ROLE_ADMIN:
    "bg-transparent text-primary font-medium shadow-none hover:bg-transparent hover:shadow-none hover:opacity-100",
  ROLE_RESPONSABLE_PROJET:
    "bg-transparent text-info font-medium shadow-none hover:bg-transparent hover:shadow-none hover:opacity-100",
  ROLE_UTILISATEUR_SIMPLE:
    "bg-transparent text-muted-foreground font-medium shadow-none hover:bg-transparent hover:shadow-none hover:opacity-100",
};

const initialEditForm: Required<UpdateUtilisateurRequest> = {
  nom: "",
  prenom: "",
  email: "",
  role: "ROLE_UTILISATEUR_SIMPLE",
  motDePasse: "",
};

function formatRole(role: string) {
  return roleLabel[role] ?? role;
}

function formatLastLogin(value: string) {
  if (!value.trim()) {
    return "Jamais connecté";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data?.error === "string") {
    return data.error;
  }

  return fallback;
}

function UserRowsSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
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
        <Skeleton className="h-4 w-32" />
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

function UserTable({
  rows,
  search,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  actionsDisabled,
  currentUserEmail,
}: {
  rows: AppUser[];
  search: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  actionsDisabled: boolean;
  currentUserEmail: string;
}) {
  if (isLoading) {
    return <UserRowsSkeleton />;
  }

  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Impossible de charger les utilisateurs.
              </p>
              <p className="text-sm text-muted-foreground">
                Vérifiez l'API puis relancez le chargement.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (rows.length === 0) {
    const message = search.trim()
      ? "Aucun utilisateur ne correspond à votre recherche."
      : "Aucun utilisateur disponible pour le moment.";

    return (
      <TableRow>
        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
          {message}
        </TableCell>
      </TableRow>
    );
  }

  return rows.map((u) => {
    const isConnectedUser = Boolean(currentUserEmail && u.email === currentUserEmail);

    return (
      <TableRow key={u.id}>
        <TableCell className="font-medium">{u.nom}</TableCell>
        <TableCell>{u.prenom}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
        <TableCell>
          <span className={roleStyle[u.role] ?? roleStyle.ROLE_UTILISATEUR_SIMPLE}>
            {formatRole(u.role)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatLastLogin(u.derniereConnexion)}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={actionsDisabled}
              onClick={() => onEdit(u)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              disabled={actionsDisabled || isConnectedUser}
              onClick={() => onDelete(u)}
              title={
                isConnectedUser ? "Vous ne pouvez pas supprimer votre propre compte." : undefined
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  });
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateUtilisateurRequest>({
    nom: "",
    prenom: "",
    email: "",
    role: "ROLE_UTILISATEUR_SIMPLE",
    motDePasse: "",
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      toast.success("Utilisateur créé avec succès.");

      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      setForm({
        nom: "",
        prenom: "",
        email: "",
        role: "ROLE_UTILISATEUR_SIMPLE",
        motDePasse: "",
      });

      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Impossible de créer l'utilisateur."));
    },
  });

  function updateField<K extends keyof CreateUtilisateurRequest>(
    field: K,
    value: CreateUtilisateurRequest[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.motDePasse.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    mutation.mutate({
      ...form,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      motDePasse: form.motDePasse.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>Créez un compte et attribuez-lui un rôle.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(event) => updateField("nom", event.target.value)}
                disabled={mutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(event) => updateField("prenom", event.target.value)}
                disabled={mutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              disabled={mutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={form.motDePasse}
              onChange={(event) => updateField("motDePasse", event.target.value)}
              disabled={mutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value) => updateField("role", value as UserRole)}
              disabled={mutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLE_ADMIN">Administrateur</SelectItem>
                <SelectItem value="ROLE_RESPONSABLE_PROJET">Responsable projet</SelectItem>
                <SelectItem value="ROLE_UTILISATEUR_SIMPLE">Utilisateur simple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Annuler
            </Button>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  open,
  selectedUser,
  onOpenChange,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  selectedUser: AppUser | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (userId: string, payload: UpdateUtilisateurRequest) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<Required<UpdateUtilisateurRequest>>(initialEditForm);

  useEffect(() => {
    if (!selectedUser) {
      setForm(initialEditForm);
      return;
    }

    setForm({
      nom: selectedUser.nom,
      prenom: selectedUser.prenom,
      email: selectedUser.email,
      role: selectedUser.role,
      motDePasse: "",
    });
  }, [selectedUser]);

  function updateField<K extends keyof UpdateUtilisateurRequest>(
    field: K,
    value: Required<UpdateUtilisateurRequest>[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.role) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const payload: UpdateUtilisateurRequest = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    if (form.motDePasse.trim()) {
      payload.motDePasse = form.motDePasse.trim();
    }

    onSubmit(selectedUser.id, payload);
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
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du compte et son rôle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom</Label>
              <Input
                id="edit-nom"
                value={form.nom}
                onChange={(event) => updateField("nom", event.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prenom">Prénom</Label>
              <Input
                id="edit-prenom"
                value={form.prenom}
                onChange={(event) => updateField("prenom", event.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Mot de passe</Label>
            <Input
              id="edit-password"
              type="password"
              value={form.motDePasse}
              onChange={(event) => updateField("motDePasse", event.target.value)}
              disabled={isPending}
              placeholder="Laisser vide pour ne pas le modifier"
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={form.role}
              onValueChange={(value) => updateField("role", value as UserRole)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLE_ADMIN">Administrateur</SelectItem>
                <SelectItem value="ROLE_RESPONSABLE_PROJET">Responsable projet</SelectItem>
                <SelectItem value="ROLE_UTILISATEUR_SIMPLE">Utilisateur simple</SelectItem>
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
              {isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  open,
  selectedUser,
  onOpenChange,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  selectedUser: AppUser | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onConfirm: (userId: string) => void;
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
          <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            {selectedUser
              ? `Cette action supprimera définitivement ${selectedUser.prenom} ${selectedUser.nom}.`
              : "Cette action supprimera définitivement cet utilisateur."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !selectedUser}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();

              if (!selectedUser) {
                return;
              }

              onConfirm(selectedUser.id);
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UsersPage() {
  const queryClient = useQueryClient();
  const { currentUser, isSessionReady } = useClientSession();
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const editMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUtilisateurRequest }) =>
      updateUser(userId, payload),
    onSuccess: async () => {
      toast.success("Utilisateur modifié avec succès.");

      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Impossible de modifier l'utilisateur."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success("Utilisateur supprimé avec succès.");

      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Impossible de supprimer l'utilisateur."));
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      [user.nom, user.prenom, user.email, formatRole(user.role)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, users]);

  function handleEditUser(user: AppUser) {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }

  function handleCloseEditDialog() {
    setSelectedUser(null);
  }

  function handleDeleteUser(user: AppUser) {
    if (isSessionReady && currentUser?.email && user.email === currentUser.email) {
      return;
    }

    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }

  function handleCloseDeleteDialog() {
    setSelectedUser(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des comptes et attribution des rôles.
          </p>
        </div>
        <Button
          className="gap-2 bg-primary text-primary-foreground"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvel utilisateur</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Chargement..." : `${rows.length} utilisateur(s) affiché(s)`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <UserTable
                rows={rows}
                search={search}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => {
                  void refetch();
                }}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                actionsDisabled={editMutation.isPending || deleteMutation.isPending}
                currentUserEmail={isSessionReady ? (currentUser?.email ?? "") : ""}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditUserDialog
        open={editDialogOpen}
        selectedUser={selectedUser}
        onOpenChange={setEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSubmit={(userId, payload) => {
          editMutation.mutate({ userId, payload });
        }}
        isPending={editMutation.isPending}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        selectedUser={selectedUser}
        onOpenChange={setDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={(userId) => {
          deleteMutation.mutate(userId);
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
