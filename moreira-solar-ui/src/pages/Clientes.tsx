import { useEffect, useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import { Cliente } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Eye, Pencil, Grid3X3, List } from "lucide-react";
import { ClienteDialog } from "@/components/ClienteDialog";
import { ClienteDetailPanel } from "@/components/panels/ClienteDetailPanel";
import { getVendedoresMap } from "@/hooks/useVendedor";

export default function Clientes() {
  const { clientes } = useClientes();
  const [view, setView] = useState<"lista" | "cards">("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [vendedoresMap, setVendedoresMap] = useState<Record<string, string>>({});

  // 🧠 Busca nomes dos vendedores apenas uma vez
  useEffect(() => {
    async function carregarVendedores() {
      const map = await getVendedoresMap();
      setVendedoresMap(map);
    }
    carregarVendedores();
  }, []);

  // 🔎 Filtragem de clientes
  const clientesFiltrados = clientes.filter((cliente) => {
    const matchesSearch =
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf_cnpj?.includes(searchTerm) ||
      cliente.telefone.includes(searchTerm);

    const tipo =
      cliente.tipo_pessoa ||
      (cliente.cpf_cnpj && cliente.cpf_cnpj.replace(/\D/g, "").length <= 11
        ? "PF"
        : "PJ");

    const matchesTipo =
      tipoFiltro === "todos" ||
      (tipoFiltro === "pf" && tipo === "PF") ||
      (tipoFiltro === "pj" && tipo === "PJ");

    return matchesSearch && matchesTipo;
  });

  // 📊 KPIs
  const kpis = {
    total: clientes.length,
    pf: clientes.filter(
      (c) =>
        c.tipo_pessoa === "PF" ||
        (!c.tipo_pessoa && c.cpf_cnpj && c.cpf_cnpj.replace(/\D/g, "").length <= 11)
    ).length,
    pj: clientes.filter(
      (c) =>
        c.tipo_pessoa === "PJ" ||
        (!c.tipo_pessoa && c.cpf_cnpj && c.cpf_cnpj.replace(/\D/g, "").length > 11)
    ).length,
  };

  const handleNew = () => {
    setEditingCliente(null);
    setDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setPanelOpen(true);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const podeEditar = true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView(view === "lista" ? "cards" : "lista")}
          >
            {view === "lista" ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pessoa Física</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pf}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pessoa Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pj}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {view === "lista" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(cliente.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{cliente.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.cpf_cnpj || "-"}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>{cliente.email || "-"}</TableCell>
                    <TableCell>
                      {cliente.cidade && cliente.estado
                        ? `${cliente.cidade}/${cliente.estado}`
                        : "-"}
                    </TableCell>
                    <TableCell>{vendedoresMap[cliente.user_id] || "—"}</TableCell>
                    <TableCell>
                      {new Date(cliente.data_cadastro || Date.now()).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(cliente)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {podeEditar && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Cards
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(cliente.nome)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{cliente.nome}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {cliente.tipo_pessoa
                          ? cliente.tipo_pessoa
                          : cliente.cpf_cnpj && cliente.cpf_cnpj.replace(/\D/g, "").length <= 11
                            ? "PF"
                            : "PJ"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="text-muted-foreground">Telefone: {cliente.telefone}</p>
                  <p className="text-muted-foreground">Email: {cliente.email || "-"}</p>
                  <p className="text-muted-foreground">
                    Vendedor: {vendedoresMap[cliente.user_id] || "—"}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(cliente)}>
                    Ver Detalhes
                  </Button>
                  {podeEditar && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clienteId={editingCliente?.id}
        mode={editingCliente ? "edit" : "create"}
      />

      <ClienteDetailPanel
        cliente={selectedCliente}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
