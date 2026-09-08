import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPieceJointe } from "@/services/pieceJointeService";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface UploadPieceJointeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess?: () => void;
}

export function UploadPieceJointeDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: UploadPieceJointeDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => uploadPieceJointe(projectId, file),
    onSuccess: () => {
      toast.success("Pièce jointe ajoutée avec succès.");
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout de la pièce jointe.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }
    mutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une pièce jointe</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier à téléverser pour ce projet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Envoi..." : "Uploader"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
