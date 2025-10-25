import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  Users,
  FileText,
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
import { useTheme } from "@/contexts/ThemeContext"; // 👈 Importa o tema
import logoMoreiraLight from "@/assets/logo-moreira.png"; // logo para modo claro
import logoMoreiraDark from "@/assets/logo-moreira-branco.png"; // logo para modo escuro

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
  const { theme } = useTheme(); // 👈 acessa o tema atual
  const logo = theme === "dark" ? logoMoreiraDark : logoMoreiraLight;

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar text-sidebar-foreground transition-colors">
      <SidebarContent>
        <SidebarGroup>
          {/* Cabeçalho do menu lateral */}
          <SidebarGroupLabel className="text-lg font-bold flex items-center justify-center px-4 py-6">
            {open ? (
              <img
                src={logo}
                alt="Moreira Solar"
                className="h-8 w-auto select-none transition-all duration-300 drop-shadow-sm"
              />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
          </SidebarGroupLabel>

          {/* Itens do menu */}
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
                          : "hover:bg-sidebar-accent/50 transition-colors"
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Rodapé com link de perfil */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfil"
                className={({ isActive }) =>
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/50 transition-colors"
                }
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Meu Perfil</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
