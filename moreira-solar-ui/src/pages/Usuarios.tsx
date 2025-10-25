import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Pencil, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { UsuarioDialog } from "@/components/UsuarioDialog";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUsuarios, Usuario } from "@/hooks/useUsuarios";

export default function Usuarios() {
  const { profile: usuarioLogado } = useUserProfile();
  const { usuarios, isLoading, updateUsuario } = useUsuarios();
  const [searchTerm, setSearchTerm] = useState("");
  const [perfilFiltro, setPerfilFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  const getUsuariosVisiveis = () => {
    if (!usuarioLogado) return [];

    if (usuarioLogado.perfil === "admin") {
      return usuarios;
    } else if (usuarioLogado.perfil === "gestor") {
      return usuarios.filter(
        (u) => u.gestorId === usuarioLogado?.id || u.id === usuarioLogado?.id
      );
    }
    return [];
  };

  const usuariosFiltrados = getUsuariosVisiveis().filter((user) => {
    const matchesSearch =
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = perfilFiltro === "todos" || user.perfil === perfilFiltro;
    const matchesStatus =
      statusFiltro === "todos" ||
      (statusFiltro === "ativo" && user.ativo) ||
      (statusFiltro === "inativo" && !user.ativo);
    return matchesSearch && matchesPerfil && matchesStatus;
  });

  const kpis = {
    total: getUsuariosVisiveis().length,
    ativos: getUsuariosVisiveis().filter((u) => u.ativo).length,
    admins: getUsuariosVisiveis().filter((u) => u.perfil === "admin").length,
    gestores: getUsuariosVisiveis().filter((u) => u.perfil === "gestor").length,
    vendedores: getUsuariosVisiveis().filter((u) => u.perfil === "vendedor").length,
  };

  const getPerfilBadge = (perfil: string) => {
    const variants: Record<string, string> = {
      admin: "bg-blue-500 text-white",
      gestor: "bg-purple-500 text-white",
      vendedor: "bg-green-500 text-white",
    };
    return <Badge className={variants[perfil]}>{perfil.toUpperCase()}</Badge>;
  };

  const handleToggleStatus = (usuario: Usuario) => {
    updateUsuario(usuario.id, { ativo: !usuario.ativo });
    toast.success(usuario.ativo ? "Usuário desativado" : "Usuário ativado");
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingUsuario(null);
    setDialogOpen(true);
  };

  const getGestorNome = (gestorId?: string) => {
    if (!gestorId) return "-";
    const gestor = usuarios.find((u) => u.id === gestorId);
    return gestor?.nome || "-";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpis.gestores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.vendedores}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={perfilFiltro} onValueChange={setPerfilFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(usuario.nome)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{getPerfilBadge(usuario.perfil)}</TableCell>
                  <TableCell>{getGestorNome(usuario.gestorId)}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? "default" : "secondary"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{usuario.ultimoAcesso || "Nunca"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(usuario)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(usuario)}
                      >
                        {usuario.ativo ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editingUsuario}
        mode={editingUsuario ? "edit" : "create"}
      />
    </div>
  );
}
