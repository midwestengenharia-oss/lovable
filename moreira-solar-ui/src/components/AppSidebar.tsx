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
import { useEffect, useMemo } from "react";

import { useUserProfile } from "@/hooks/useUserProfile";
import { usePermissoes } from "@/hooks/usePermissoes";

// ====== mesma convenção de módulos usada na tabela `permissoes`
type ModuloId =
  | "dashboard"
  | "propostas"
  | "crm"
  | "clientes"
  | "orcamentos"
  | "projetos"
  | "pos-venda"
  | "cobrancas"
  | "gestao-faturas"
  | "usuarios"
  | "integracoes"
  | "parametros"
  | "kanban-admin"
  | "kanban-forms";

// Itens do menu com o id do módulo correspondente
const menuItems: Array<{ title: string; url: string; icon: any; modulo: ModuloId }> = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, modulo: "dashboard" },
  { title: "Propostas", url: "/propostas", icon: Calculator, modulo: "propostas" },
  { title: "CRM (Leads)", url: "/crm", icon: Users, modulo: "crm" },
  { title: "Clientes", url: "/clientes", icon: Users2, modulo: "clientes" },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText, modulo: "orcamentos" },
  { title: "Projetos", url: "/projetos", icon: Layers, modulo: "projetos" },
  { title: "Pós-venda", url: "/pos-venda", icon: Headphones, modulo: "pos-venda" },
  { title: "Cobranças", url: "/cobrancas", icon: Receipt, modulo: "cobrancas" },
  { title: "Gestão de Faturas", url: "/gestao-faturas", icon: FileSpreadsheet, modulo: "gestao-faturas" },
  { title: "Usuários", url: "/usuarios", icon: Users2, modulo: "usuarios" },
  { title: "Integrações", url: "/integracoes", icon: Link2, modulo: "integracoes" },
  { title: "Parâmetros", url: "/parametros", icon: Settings, modulo: "parametros" },
];

// Grupo Admin (Kanban) — mapeado para módulos próprios
const adminItems: Array<{ title: string; url: string; icon: any; modulo: ModuloId }> = [
  { title: "Kanban (Admin)", url: "/admin/kanban", icon: Columns3, modulo: "kanban-admin" },
  { title: "Form. da Fase", url: "/admin/kanban/forms", icon: ListChecks, modulo: "kanban-forms" },
];

// Fallback de permissões por perfil (apenas campo "visualizar" importa aqui)
const getPermissoesDefault = (perfil: "admin" | "gestor" | "vendedor") => {
  const allTrue = (mods: ModuloId[]) => new Set(mods);
  if (perfil === "admin") {
    return allTrue([
      "dashboard", "propostas", "crm", "clientes", "orcamentos", "projetos", "pos-venda", "cobrancas",
      "gestao-faturas", "usuarios", "integracoes", "parametros", "kanban-admin", "kanban-forms"
    ]);
  }
  if (perfil === "gestor") {
    return allTrue([
      "dashboard", "propostas", "crm", "clientes", "orcamentos", "projetos", "pos-venda", "cobrancas",
      "gestao-faturas", "integracoes", // sem "usuarios"/"parametros" por padrão
      "kanban-admin", "kanban-forms"
    ]);
  }
  // vendedor
  return allTrue(["dashboard", "crm", "propostas", "clientes", "orcamentos"]);
};

export function AppSidebar() {
  const { open } = useSidebar();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const logo = theme === "dark" ? logoMoreiraDark : logoMoreiraLight;

  const { profile } = useUserProfile(); // { id, perfil }
  const { permissoes } = usePermissoes(profile?.id); // lista com { modulo, visualizar, ... }

  // Monta um Set de módulos com acesso de visualização
  const canViewSet = useMemo(() => {
    if (!profile) return new Set<ModuloId>();

    // Admin vê tudo
    if (profile.perfil === "admin") {
      return getPermissoesDefault("admin");
    }

    // Se vier algo do BD, usa o que está salvo
    if (permissoes && permissoes.length > 0) {
      const s = new Set<ModuloId>();
      for (const p of permissoes) {
        if (p.visualizar) s.add(p.modulo as ModuloId);
      }
      return s;
    }

    // Senão, aplica o default do perfil
    return getPermissoesDefault(profile.perfil);
  }, [profile, permissoes]);

  // Mostrar grupo Admin apenas para gestor/admin (e se tiver permissão)
  const showAdminGroup = useMemo(() => {
    if (!profile) return false;
    if (profile.perfil === "admin" || profile.perfil === "gestor") {
      // precisa pelo menos um dos módulos de admin liberado
      return canViewSet.has("kanban-admin") || canViewSet.has("kanban-forms");
    }
    return false;
  }, [profile, canViewSet]);

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
              {menuItems
                .filter((item) => canViewSet.has(item.modulo))
                .map((item) => (
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
        {showAdminGroup && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems
                  .filter((item) => canViewSet.has(item.modulo))
                  .map((item) => (
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
