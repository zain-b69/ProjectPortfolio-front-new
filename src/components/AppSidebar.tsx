import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Users2,
  UserCog,
  FileBarChart,
  History,
  Droplets,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useClientSession } from "@/hooks/use-client-session";
import type { UserRole } from "@/services/sessionService";

const items: { title: string; url: string; icon: typeof LayoutDashboard; roles?: UserRole[] }[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projets", url: "/projets", icon: FolderKanban },
  { title: "Ressources", url: "/ressources", icon: Users2 },
  { title: "Utilisateurs", url: "/utilisateurs", icon: UserCog, roles: ["ROLE_ADMIN"] },
  { title: "Rapports", url: "/rapports", icon: FileBarChart },
  { title: "Historique", url: "/historique", icon: History },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser } = useClientSession();

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  const visibleItems = items.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role)),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Droplets className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold text-sidebar-foreground">ProjectPortfolio</p>
            <p className="truncate text-[11px] text-muted-foreground">DTI · ONEE Branche Eau</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} ONEE — Usage interne DTI
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
