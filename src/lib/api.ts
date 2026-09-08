import axios from "axios";

// Backend Spring Boot API base URL — override via VITE_API_BASE_URL when connecting.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const protectedPrefixes = [
  "/api/projets",
  "/api/utilisateurs",
  "/api/ressources",
  "/api/couts",
  "/api/risques",
  "/projets",
  "/utilisateurs",
  "/ressources",
  "/couts",
  "/risques",
];

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token");
      const isAuthRequest =
        config.url?.includes("/auth/login") || config.url?.includes("/auth/register");
      const isProtectedRequest = protectedPrefixes.some((prefix) => config.url?.includes(prefix));

      if (token && !isAuthRequest && isProtectedRequest) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Endpoint helpers (frontend is wired but currently uses mock data).
export const endpoints = {
  login: "/auth/login",
  projets: "/projets",
  utilisateurs: "/utilisateurs",
  ressources: "/ressources",
  couts: "/couts",
  risques: "/risques",
  affectations: "/affectations",
  piecesJointes: "/pieces-jointes",
  historiques: "/historiques",
};
