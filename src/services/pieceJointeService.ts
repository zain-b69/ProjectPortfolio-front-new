import api from "./api";

export interface PieceJointeResponse {
  idPieceJointe: number;
  nomFichier: string;
  dateAjout: string;
  idProjet: number;
}

export interface PieceJointeDownload {
  blob: Blob;
  filename: string;
}

function extractFilenameFromContentDisposition(contentDisposition: string | undefined) {
  if (!contentDisposition) {
    return "";
  }

  const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8FilenameMatch?.[1]) {
    return decodeURIComponent(utf8FilenameMatch[1].replace(/"/g, ""));
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? "";
}

export async function uploadPieceJointe(
  projetId: number,
  file: File,
): Promise<PieceJointeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<PieceJointeResponse>(
    `/api/pieces-jointes/projets/${projetId}`,
    formData,
    {},
  );

  return response.data;
}

export async function getPiecesJointes(projetId: number): Promise<PieceJointeResponse[]> {
  const response = await api.get<PieceJointeResponse[]>(`/api/pieces-jointes/projets/${projetId}`);
  return response.data;
}

export async function downloadPieceJointe(pieceJointeId: number): Promise<PieceJointeDownload> {
  const response = await api.get<Blob>(`/api/pieces-jointes/${pieceJointeId}/download`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    filename:
      extractFilenameFromContentDisposition(response.headers["content-disposition"]) ||
      `piece-jointe-${pieceJointeId}`,
  };
}

export async function deletePieceJointe(pieceJointeId: number): Promise<void> {
  await api.delete(`/api/pieces-jointes/${pieceJointeId}`);
}
