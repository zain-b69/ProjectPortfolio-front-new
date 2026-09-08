import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

const protectedPrefixes = [
  "/api/projets",
  "/api/utilisateurs",
  "/api/ressources",
  "/api/couts",
  "/api/risques",
  "/api/pieces-jointes",
  "/projets",
  "/utilisateurs",
  "/ressources",
  "/couts",
  "/risques",
  "/dashboard",
  "/rapports",
  "/historique",
];

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    const isAuthRequest =
      config.url?.includes("/auth/login") || config.url?.includes("/auth/register");
    const isProtectedRequest = protectedPrefixes.some((prefix) => config.url?.includes(prefix));

    if (token && !isAuthRequest && isProtectedRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
