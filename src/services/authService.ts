import api from "./api";
import { clearSession, persistAuthSession } from "./sessionService";

export const login = async (email: string, motDePasse: string) => {
  const response = await api.post("/auth/login", {
    email,
    motDePasse,
  });

  persistAuthSession(response.data);

  return response.data;
};

export const logout = () => {
  clearSession();
};
