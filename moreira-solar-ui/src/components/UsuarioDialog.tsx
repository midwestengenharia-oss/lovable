import { useState, useEffect } from "react";
import { useUsuarios, Usuario } from "@/hooks/useUsuarios";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePermissoes, Permissao } from "@/hooks/usePermissoes";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ============================= Constantes =============================

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

// Permissões padrão por perfil
const getPermissoesDefault = (perfil: "admin" | "gestor" | "vendedor"): Permissao[] => {
  if (perfil === "admin") {
    return MODULOS.map((m) => ({
      modulo: m.id,
      visualizar: true,
      criar: true,
      editar: true,
      excluir: true,
    }));
  }
  if (perfil === "gestor") {
    return MODULOS.map((m) => ({
      modulo: m.id,
      visualizar: true,
      criar: true,
      editar: true,
      excluir: ["usuarios", "parametros"].includes(m.id) ? false : true,
    }));
  }
  // vendedor
  return MODULOS.map((m) => ({
    modulo: m.id,
    visualizar: ["dashboard", "crm", "propostas", "clientes", "orcamentos"].includes(m.id),
    criar: ["crm", "propostas", "orcamentos"].includes(m.id),
    editar: ["crm", "propostas", "orcamentos"].includes(m.id),
    excluir: false,
  }));
};

// ============================= Props =============================

interface UsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
  mode: "create" | "edit";
}

// ============================= Componente =============================

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

  // Hook de permissões (carrega quando estiver editando e houver usuário)
  const {
    permissoes: permissoesBD,
    isLoadingPermissoes,
    upsertPermissoes,
    upsertingPermissoes,
  } = usePermissoes(mode === "edit" ? usuario?.id : undefined);

  const [permissoes, setPermissoes] = useState<Permissao[]>([]);

  // Inicialização ao abrir/modal & mudanças de usuário/mode
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

      // Se existir no BD, usar; senão, default do perfil atual
      if (permissoesBD && permissoesBD.length > 0) {
        setPermissoes(permissoesBD);
      } else {
        setPermissoes(getPermissoesDefault(usuario.perfil));
      }
    } else {
      // modo create
      const perfilInicial: "admin" | "gestor" | "vendedor" = "vendedor";
      setFormData({
        nome: "",
        email: "",
        senha: "",
        perfil: perfilInicial,
        gestorId: userProfile?.perfil === "gestor" ? userProfile.id : "",
        ativo: true,
      });
      setPermissoes(getPermissoesDefault(perfilInicial));
    }
  }, [usuario, mode, open, userProfile, permissoesBD]);

  // Atualiza permissões quando perfil muda (apenas em criação ou quando não temos usuario fixo)
  useEffect(() => {
    if (!usuario) {
      setPermissoes(getPermissoesDefault(formData.perfil));
    }
  }, [formData.perfil, usuario]);

  // Helpers de permissão
  const handlePermissaoChange = (modulo: string, acao: keyof Permissao, value: boolean) => {
    setPermissoes((prev) => {
      const i = prev.findIndex((p) => p.modulo === modulo);
      if (i >= 0) {
        const clone = [...prev];
        clone[i] = { ...clone[i], [acao]: value };
        return clone;
      }
      return prev;
    });
  };

  const getPermissao = (modulo: string) => permissoes.find((p) => p.modulo === modulo);

  const handleAplicarPadrao = () => {
    const novas = getPermissoesDefault(formData.perfil);
    setPermissoes(novas);
    toast.success("Permissões padrão aplicadas.");
  };

  // Validações e submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (mode === "create" && !formData.senha) {
      toast.error("Senha é obrigatória.");
      return;
    }
    if (formData.senha && formData.senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres.");
      return;
    }

    // Email único
    if (mode === "create" || (usuario && usuario.email !== formData.email)) {
      const emailExiste = usuarios.some((u) => u.email === formData.email);
      if (emailExiste) {
        toast.error("Email já cadastrado.");
        return;
      }
    }

    try {
      if (mode === "edit" && usuario) {
        const updates: Partial<Usuario> & { id: string } = {
          id: usuario.id,
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          gestor_id: formData.perfil === "vendedor" ? formData.gestorId : null,
          ativo: formData.ativo,
        };

        await updateUsuario(updates);
        await upsertPermissoes({ userId: usuario.id, permissoes });

        toast.success("Usuário atualizado com sucesso.");
        onOpenChange(false);
        return;
      }

      // Criação
      const { user, error } = await signUp(formData.email, formData.senha, formData.nome, formData.perfil);
      if (error) {
        toast.error("Erro ao criar usuário: " + error.message);
        return;
      }

      if (user?.id) {
        await upsertPermissoes({ userId: user.id, permissoes });
      } else {
        // Caso seu signUp não retorne id imediatamente
        toast.info("Usuário criado. As permissões serão aplicadas ao sincronizar o perfil.");
      }

      toast.success("Usuário criado com sucesso! Enviamos um email de confirmação.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err?.message || "tente novamente."));
    }
  };

  const gestores = usuarios.filter((u) => u.perfil === "gestor");
  const isAdmin = formData.perfil === "admin";
  const isBusy = isUpdating || upsertingPermissoes || isLoadingPermissoes;

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
                    onValueChange={(v: "admin" | "gestor" | "vendedor") =>
                      setFormData({ ...formData, perfil: v })
                    }
                    disabled={userProfile?.perfil === "gestor"}
                  >
                    <SelectTrigger id="perfil">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userProfile?.perfil === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                      {userProfile?.perfil === "admin" && <SelectItem value="gestor">Gestor</SelectItem>}
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
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {isLoadingPermissoes
                    ? "Carregando permissões…"
                    : mode === "edit" && permissoesBD && permissoesBD.length === 0
                      ? "Sem permissões salvas — usando padrão do perfil."
                      : null}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleAplicarPadrao}>
                  Aplicar Permissões Padrão
                </Button>
              </div>

              <div className="space-y-4">
                {MODULOS.map((modulo) => {
                  const perm = getPermissao(modulo.id);
                  return (
                    <div key={modulo.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{modulo.nome}</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {(["visualizar", "criar", "editar", "excluir"] as (keyof Permissao)[]).map((acao) => (
                          <div key={acao} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${modulo.id}-${acao}`}
                              checked={!!perm?.[acao]}
                              onCheckedChange={(checked) =>
                                handlePermissaoChange(modulo.id, acao, Boolean(checked))
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? "Salvando..." : mode === "edit" ? "Salvar" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
