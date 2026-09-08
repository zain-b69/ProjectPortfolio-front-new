import { useEffect, useState } from "react";
import { getSessionUser, getStoredToken, type SessionUser } from "@/services/sessionService";

export function useClientSession() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getStoredToken()));
    setCurrentUser(getSessionUser());
    setIsSessionReady(true);
  }, []);

  return { currentUser, hasToken, isSessionReady };
}
