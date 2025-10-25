import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  Users,
  FileText,
  FileCheck,
  Layers,
  Headphones,
  Link2,
  Settings,
  User,
  Sun,
  Receipt,
  Users2,
  FileSpreadsheet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logoMoreira from "@/assets/logo-moreira.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Propostas", url: "/propostas", icon: Calculator },
  { title: "CRM (Leads)", url: "/crm", icon: Users },
  { title: "Clientes", url: "/clientes", icon: Users2 },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Projetos", url: "/projetos", icon: Layers },
  { title: "Pós-venda", url: "/pos-venda", icon: Headphones },
  { title: "Cobranças", url: "/cobrancas", icon: Receipt },
  { title: "Gestão de Faturas", url: "/gestao-faturas", icon: FileSpreadsheet },
  { title: "Usuários", url: "/usuarios", icon: Users2 },
  { title: "Integrações", url: "/integracoes", icon: Link2 },
  { title: "Parâmetros", url: "/parametros", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold flex items-center gap-2 px-4 py-4">
            {open ? (
              <img src={logoMoreira} alt="Moreira Solar" className="h-6 w-auto" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfil"
                className={({ isActive }) =>
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/50"
                }
              >
                <User className="h-4 w-4" />
                <span>Meu Perfil</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
