import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientes } from "@/hooks/useClientes";
import { Cliente } from "@/types/supabase";
import { toast } from "sonner";

interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteCreated?: (clienteId: string) => void;
  clienteId?: string;
  mode?: "create" | "edit";
}

export function ClienteDialog({ open, onOpenChange, onClienteCreated, clienteId, mode = "create" }: ClienteDialogProps) {
  const { clientes, addCliente, updateCliente, isAdding, isUpdating } = useClientes();
  const [formData, setFormData] = useState<Omit<Cliente, "id" | "user_id" | "data_cadastro" | "created_at" | "updated_at">>({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    rua: "",
    numero: "",
    bairro: "",
    cep: "",
    cidade: "",
    estado: "",
    profissao: "",
    tempo_profissao: "",
    estado_civil: "",
    tempo_residencia: "",
    renda: undefined,
    fantasia: "",
    observacoes: "",
  });

  // Load cliente data when in edit mode
  useEffect(() => {
    if (mode === "edit" && clienteId) {
      const cliente = clientes.find((c) => c.id === clienteId);
      if (cliente) {
        setFormData({
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj || "",
          telefone: cliente.telefone,
          email: cliente.email || "",
          rua: cliente.rua || "",
          numero: cliente.numero || "",
          bairro: cliente.bairro || "",
          cep: cliente.cep || "",
          cidade: cliente.cidade || "",
          estado: cliente.estado || "",
          profissao: cliente.profissao || "",
          tempo_profissao: cliente.tempo_profissao || "",
          estado_civil: cliente.estado_civil || "",
          tempo_residencia: cliente.tempo_residencia || "",
          renda: cliente.renda || undefined,
          fantasia: cliente.fantasia || "",
          observacoes: cliente.observacoes || "",
        });
      }
    } else if (mode === "create") {
      // Reset form when switching to create mode
      setFormData({
        nome: "",
        cpf_cnpj: "",
        telefone: "",
        email: "",
        rua: "",
        numero: "",
        bairro: "",
        cep: "",
        cidade: "",
        estado: "",
        profissao: "",
        tempo_profissao: "",
        estado_civil: "",
        tempo_residencia: "",
        renda: undefined,
        fantasia: "",
        observacoes: "",
      });
    }
  }, [mode, clienteId, clientes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error("Nome e Telefone são obrigatórios");
      return;
    }

    if (mode === "edit" && clienteId) {
      // Update existing cliente
      updateCliente({ id: clienteId, ...formData });
    } else {
      // Create new cliente
      addCliente(formData);

      // Note: onClienteCreated would need the actual Supabase UUID
      // Currently not called as we don't have access to the generated ID synchronously
      // TODO: If onClienteCreated is needed, consider using mutateAsync or mutation options
    }

    onOpenChange(false);
    setFormData({
      nome: "",
      cpf_cnpj: "",
      telefone: "",
      email: "",
      rua: "",
      numero: "",
      bairro: "",
      cep: "",
      cidade: "",
      estado: "",
      profissao: "",
      tempo_profissao: "",
      estado_civil: "",
      tempo_residencia: "",
      renda: undefined,
      fantasia: "",
      observacoes: "",
    });
  };

  const isLoading = isAdding || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="pessoais" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoais" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    id="profissao"
                    value={formData.profissao}
                    onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempo_profissao">Tempo na Profissão</Label>
                  <Input
                    id="tempo_profissao"
                    value={formData.tempo_profissao}
                    onChange={(e) => setFormData({ ...formData, tempo_profissao: e.target.value })}
                    placeholder="Ex: 5 anos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado_civil">Estado Civil</Label>
                  <Input
                    id="estado_civil"
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempo_residencia">Tempo de Residência</Label>
                  <Input
                    id="tempo_residencia"
                    value={formData.tempo_residencia}
                    onChange={(e) => setFormData({ ...formData, tempo_residencia: e.target.value })}
                    placeholder="Ex: 3 anos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renda">Renda (R$)</Label>
                  <Input
                    id="renda"
                    type="number"
                    step="0.01"
                    value={formData.renda || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        renda: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="endereco" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input
                    id="rua"
                    value={formData.rua}
                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outros" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fantasia">Nome Fantasia</Label>
                  <Input
                    id="fantasia"
                    value={formData.fantasia}
                    onChange={(e) => setFormData({ ...formData, fantasia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {mode === "edit"
                ? (isUpdating ? "Salvando..." : "Salvar Alterações")
                : (isAdding ? "Cadastrando..." : "Cadastrar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
