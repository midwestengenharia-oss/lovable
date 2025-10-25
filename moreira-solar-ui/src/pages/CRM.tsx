import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/supabase";
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ViewToggle } from "@/components/kanban/ViewToggle";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanCardData } from "@/components/kanban/KanbanCard";
import { SidePanel } from "@/components/panels/SidePanel";
import { Timeline, TimelineEvent } from "@/components/shared/Timeline";
import { DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";

export default function CRM() {
  const { leads, isLoading, addLead, updateLead, deleteLead } = useLeads();
  const [view, setView] = useState<"kanban" | "lista">("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [formData, setFormData] = useState<Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">>({
    data: new Date().toISOString().split("T")[0],
    cliente: "",
    telefone: "",
    email: "",
    cidade: "",
    uf: "",
    fonte: "",
    status: "Novo",
    dono_id: null,
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm);
    const matchesStatus = statusFilter === "todos" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormData(lead);
    } else {
      setEditingLead(null);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        cliente: "",
        telefone: "",
        email: "",
        cidade: "",
        uf: "",
        fonte: "",
        status: "Novo",
        dono_id: null,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente || !formData.telefone || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingLead) {
      updateLead({ id: editingLead.id, ...formData });
    } else {
      addLead(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lead?")) {
      deleteLead(id);
    }
  };

  const getStatusBadge = (status: Lead["status"]) => {
    const variants: Record<Lead["status"], string> = {
      Novo: "bg-primary text-primary-foreground",
      Qualificado: "bg-secondary text-secondary-foreground",
      "Follow-up": "bg-accent text-accent-foreground",
      Perdido: "bg-destructive text-destructive-foreground",
      Convertido: "bg-success text-success-foreground",
    };
    return <Badge className={variants[status] || "bg-muted"}>{status}</Badge>;
  };

  const kanbanColumns = [
    { id: "Novo", title: "Novo", color: "#3b82f6" },
    { id: "Qualificado", title: "Qualificado", color: "#10b981" },
    { id: "Follow-up", title: "Follow-up", color: "#f59e0b" },
    { id: "Perdido", title: "Perdido", color: "#ef4444" },
    { id: "Convertido", title: "Convertido", color: "#22c55e" },
  ];

  const getKanbanData = () => {
    return kanbanColumns.map((col) => ({
      ...col,
      items: filteredLeads
        .filter((lead) => lead.status === col.id)
        .map((lead): KanbanCardData => ({
          id: lead.id,
          title: lead.cliente,
          subtitle: lead.telefone,
          badges: [
            { label: lead.fonte || "Sem fonte", variant: "outline" as const },
            { label: lead.status, className: "bg-primary/10 text-primary" },
          ],
          avatar: { name: "Usuário" },
          metadata: {
            "E-mail": lead.email,
            "Cidade": lead.cidade ? `${lead.cidade}/${lead.uf}` : "-",
            "Data": lead.data,
          },
        })),
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as Lead["status"];
    const lead = leads.find((l) => l.id === leadId);

    if (lead && lead.status !== newStatus) {
      updateLead({ id: leadId, status: newStatus });
      toast.success(`Lead movido para ${newStatus}`);
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // ✅ Verifica se já existe cliente com o mesmo telefone ou email
      const { data: existing, error: existingError } = await supabase
        .from("clientes")
        .select("id, nome, telefone, email")
        .or(`telefone.eq.${lead.telefone},email.eq.${lead.email}`)
        .eq("user_id", user.id)
        .limit(1);

      if (existingError) throw existingError;

      if (existing && existing.length > 0) {
        toast.warning(`Cliente "${lead.cliente}" já existe na base.`);

        // Atualiza o status sem disparar o toast padrão
        await supabase
          .from("leads")
          .update({ status: "Convertido" })
          .eq("id", lead.id);

        return;
      }

      // ✅ Detecta se é Pessoa Física ou Jurídica automaticamente
      const tipoPessoa =
        lead.cpf_cnpj && lead.cpf_cnpj.replace(/\D/g, "").length > 11
          ? "PJ"
          : "PF";

      // ✅ Insere novo cliente se não existir
      const { error: insertError } = await supabase.from("clientes").insert([
        {
          nome: lead.cliente,
          telefone: lead.telefone,
          email: lead.email,
          cidade: lead.cidade,
          estado: lead.uf,
          origem: lead.fonte || "CRM",
          tipo_pessoa: tipoPessoa,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      await updateLead({ id: lead.id, status: "Convertido" });
      toast.success(`Lead convertido em cliente com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao converter lead em cliente.");
    }
  };



  const getMockTimeline = (lead: Lead): TimelineEvent[] => [
    {
      id: "1",
      title: "Lead criado",
      description: `Lead ${lead.cliente} foi criado no sistema`,
      date: new Date(lead.data),
      type: "info",
      user: "Usuário",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM (Leads)</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Input
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Telefone *</Label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Fonte</Label>
                    <Select value={formData.fonte} onValueChange={(v) => setFormData({ ...formData, fonte: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Indicação">Indicação</SelectItem>
                        <SelectItem value="Site">Site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      maxLength={2}
                      value={formData.uf}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Novo">Novo</SelectItem>
                        <SelectItem value="Qualificado">Qualificado</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingLead ? "Salvar" : "Criar Lead"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="Novo">Novo</SelectItem>
            <SelectItem value="Qualificado">Qualificado</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
            <SelectItem value="Perdido">Perdido</SelectItem>
            <SelectItem value="Convertido">Convertido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === "kanban" ? (
        <KanbanBoard columns={getKanbanData()} onDragEnd={handleDragEnd} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.data}</TableCell>
                  <TableCell className="font-medium">{lead.cliente}</TableCell>
                  <TableCell>{lead.telefone}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.cidade}/{lead.uf}</TableCell>
                  <TableCell>{lead.fonte}</TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(lead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleConvertLead(lead)}>
                        <UserPlus className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
