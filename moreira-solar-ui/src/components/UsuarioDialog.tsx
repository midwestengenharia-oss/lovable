import { useState, useEffect } from "react";
import { useUsuarios, Usuario } from "@/hooks/useUsuarios";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Permissões por módulo (TODO: Migrar para tabela 'permissoes' do Supabase)
interface Permissao {
  modulo: string;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

interface UsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
  mode: "create" | "edit";
}

const MODULOS = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "crm", nome: "CRM (Leads)" },
  { id: "propostas", nome: "Propostas" },
  { id: "clientes", nome: "Clientes" },
  { id: "orcamentos", nome: "Orçamentos" },
  { id: "projetos", nome: "Projetos" },
  { id: "pos-venda", nome: "Pós-venda" },
  { id: "cobrancas", nome: "Cobranças" },
  { id: "usuarios", nome: "Usuários" },
  { id: "parametros", nome: "Parâmetros" },
  { id: "integracoes", nome: "Integrações" },
];

// Função para gerar permissões padrão por perfil (TODO: Migrar para Supabase)
const getPermissoesDefault = (perfil: string): Permissao[] => {
  if (perfil === 'admin') {
    return MODULOS.map(m => ({
      modulo: m.id,
      visualizar: true,
      criar: true,
      editar: true,
      excluir: true
    }));
  }
  if (perfil === 'gestor') {
    return MODULOS.map(m => ({
      modulo: m.id,
      visualizar: true,
      criar: true,
      editar: true,
      excluir: ['usuarios', 'parametros'].includes(m.id) ? false : true
    }));
  }
  // vendedor
  return MODULOS.map(m => ({
    modulo: m.id,
    visualizar: ['dashboard', 'crm', 'propostas', 'clientes', 'orcamentos'].includes(m.id),
    criar: ['crm', 'propostas', 'orcamentos'].includes(m.id),
    editar: ['crm', 'propostas', 'orcamentos'].includes(m.id),
    excluir: false
  }));
};

export function UsuarioDialog({ open, onOpenChange, usuario, mode }: UsuarioDialogProps) {
  const { usuarios, updateUsuario, isUpdating } = useUsuarios();
  const { signUp } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "vendedor" as "admin" | "gestor" | "vendedor",
    gestorId: "",
    ativo: true,
  });
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);

  useEffect(() => {
    if (usuario && mode === "edit") {
      setFormData({
        nome: usuario.nome,
        email: usuario.email || "",
        senha: "",
        perfil: usuario.perfil,
        gestorId: usuario.gestor_id || "",
        ativo: usuario.ativo ?? true,
      });
      // TODO: Carregar permissões do usuário do Supabase
      setPermissoes(getPermissoesDefault(usuario.perfil));
    } else {
      setFormData({
        nome: "",
        email: "",
        senha: "",
        perfil: "vendedor",
        gestorId: userProfile?.perfil === "gestor" ? userProfile.id : "",
        ativo: true,
      });
      setPermissoes(getPermissoesDefault("vendedor"));
    }
  }, [usuario, mode, open, userProfile]);

  useEffect(() => {
    // Atualiza permissões quando perfil muda
    if (!usuario) {
      setPermissoes(getPermissoesDefault(formData.perfil));
    }
  }, [formData.perfil, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (mode === "create" && !formData.senha) {
      toast.error("Senha é obrigatória");
      return;
    }

    if (formData.senha && formData.senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    // Verifica email único
    if (mode === "create" || (usuario && usuario.email !== formData.email)) {
      const emailExiste = usuarios.some((u) => u.email === formData.email);
      if (emailExiste) {
        toast.error("Email já cadastrado");
        return;
      }
    }

    if (mode === "edit" && usuario) {
      // Atualiza usuário existente
      const updates: Partial<Usuario> & { id: string } = {
        id: usuario.id,
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil,
        gestor_id: formData.perfil === "vendedor" ? formData.gestorId : null,
        ativo: formData.ativo,
        // TODO: Salvar permissões na tabela 'permissoes' do Supabase
      };
      // Nota: Senha não pode ser atualizada via profiles - requer Supabase Auth
      updateUsuario(updates);
    } else {
      // Cria novo usuário via Supabase Auth
      const { error } = await signUp(formData.email, formData.senha, formData.nome, formData.perfil);

      if (error) {
        toast.error("Erro ao criar usuário: " + error.message);
        return;
      }

      toast.success("Usuário criado com sucesso! Um email de confirmação foi enviado.");
      // TODO: Salvar permissões na tabela 'permissoes' do Supabase
    }

    onOpenChange(false);
  };

  const handlePermissaoChange = (modulo: string, acao: keyof Permissao, value: boolean) => {
    setPermissoes((prev) => {
      const index = prev.findIndex((p) => p.modulo === modulo);
      if (index >= 0) {
        const newPermissoes = [...prev];
        newPermissoes[index] = { ...newPermissoes[index], [acao]: value };
        return newPermissoes;
      }
      return prev;
    });
  };

  const getPermissao = (modulo: string) => {
    return permissoes.find((p) => p.modulo === modulo);
  };

  const handleAplicarPadrao = () => {
    setPermissoes(getPermissoesDefault(formData.perfil));
    toast.success("Permissões padrão aplicadas");
  };

  const gestores = usuarios.filter((u) => u.perfil === "gestor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="dados">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4">
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha {mode === "create" ? "*" : "(deixe em branco para manter)"}
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required={mode === "create"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil *</Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(v: any) => setFormData({ ...formData, perfil: v })}
                    disabled={userProfile?.perfil === "gestor"}
                  >
                    <SelectTrigger id="perfil">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userProfile?.perfil === "admin" && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                      {userProfile?.perfil === "admin" && (
                        <SelectItem value="gestor">Gestor</SelectItem>
                      )}
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.perfil === "vendedor" && (
                  <div className="space-y-2">
                    <Label htmlFor="gestor">Gestor Responsável</Label>
                    <Select
                      value={formData.gestorId}
                      onValueChange={(v) => setFormData({ ...formData, gestorId: v })}
                      disabled={userProfile?.perfil === "gestor"}
                    >
                      <SelectTrigger id="gestor">
                        <SelectValue placeholder="Selecione um gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {gestores.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Usuário ativo</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissoes" className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleAplicarPadrao}>
                  Aplicar Permissões Padrão
                </Button>
              </div>

              <div className="space-y-4">
                {MODULOS.map((modulo) => {
                  const perm = getPermissao(modulo.id);
                  const isAdmin = formData.perfil === "admin";

                  return (
                    <div key={modulo.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{modulo.nome}</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {["visualizar", "criar", "editar", "excluir"].map((acao) => (
                          <div key={acao} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${modulo.id}-${acao}`}
                              checked={perm?.[acao as keyof Permissao] as boolean}
                              onCheckedChange={(checked) =>
                                handlePermissaoChange(modulo.id, acao as keyof Permissao, checked as boolean)
                              }
                              disabled={isAdmin}
                            />
                            <label
                              htmlFor={`${modulo.id}-${acao}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {acao}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating
                ? "Salvando..."
                : mode === "edit"
                ? "Salvar"
                : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
