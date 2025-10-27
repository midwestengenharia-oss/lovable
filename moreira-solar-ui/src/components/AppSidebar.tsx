import { NavLink, useNavigate } from "react-router-dom";
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
  LogOut,
  Columns3,
  ListChecks,
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
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import logoMoreiraLight from "@/assets/logo-moreira.png";
import logoMoreiraDark from "@/assets/logo-moreira-branco.png";
import { useEffect, useState } from "react";

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

// 👇 Itens de administração do Kanban
const adminItems = [
  { title: "Kanban (Admin)", url: "/admin/kanban", icon: Columns3 },
  { title: "Form. da Fase", url: "/admin/kanban/forms", icon: ListChecks },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const logo = theme === "dark" ? logoMoreiraDark : logoMoreiraLight;

  // (opcional) só mostrar Admin para gestor/admin
  const [showAdmin, setShowAdmin] = useState<boolean>(true); // deixe true se quiser sempre visível

  useEffect(() => {
    // Se quiser habilitar a checagem de papel, troque para false por padrão
    // e descomente o bloco abaixo.
    // setShowAdmin(false);
    // (async () => {
    //   const { data: { user } } = await supabase.auth.getUser();
    //   if (!user) return;
    //   const { data } = await supabase
    //     .from("profiles")
    //     .select("perfil")
    //     .eq("id", user.id)
    //     .maybeSingle();
    //   if (data?.perfil === "gestor" || data?.perfil === "admin") {
    //     setShowAdmin(true);
    //   }
    // })();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão encerrada com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao encerrar sessão.");
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar text-sidebar-foreground transition-colors"
    >
      <SidebarContent>
        {/* Cabeçalho */}
        <SidebarGroup>
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

          {/* Menus principais */}
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

        {/* Grupo Admin (Kanban) */}
        {showAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
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
        )}
      </SidebarContent>

      {/* Rodapé */}
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

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
