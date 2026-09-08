import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "@/services/authService";
import { formatRoleLabel, getUserInitials } from "@/services/sessionService";
import { useClientSession } from "@/hooks/use-client-session";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { currentUser, hasToken, isSessionReady } = useClientSession();

  useEffect(() => {
    if (isSessionReady && !hasToken) {
      navigate({ to: "/login" });
    }
  }, [hasToken, isSessionReady, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const displayName =
    isSessionReady && currentUser
      ? `${currentUser.prenom} ${currentUser.nom}`.trim() || currentUser.email
      : "Utilisateur";

  const displayRole = isSessionReady ? formatRoleLabel(currentUser?.role ?? "") : "";

  const initials = isSessionReady ? getUserInitials(currentUser) : "??";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-4">
            <SidebarTrigger />

            <div className="ml-2 hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-foreground">
                ONEE · Branche Eau — DTI
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Gestion des portefeuilles projets
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden h-8 w-px bg-border sm:block" />

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{displayRole}</p>
              </div>

              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
                {initials}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 hover:border-destructive hover:text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}
