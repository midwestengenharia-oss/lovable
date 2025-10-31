import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Supabase removido do front: usar BFF endpoints
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Lock, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export default function MeuPerfil() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cliente, setCliente] = useState<any>(null);
    const [dadosCliente, setDadosCliente] = useState<any>({});
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    // Estados para alteração de senha
    const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

    useEffect(() => {
  (async () => {
    try {
      const res = await fetch('/api/clientes/me', { credentials: 'include' });
      if (res.status === 401) { toast.error('Fa�a login!'); navigate('/login-cliente'); return; }
      if (!res.ok) throw new Error('cliente_me_failed');
      const me = await res.json();
      setCliente(me);
      setDadosCliente(me);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar seus dados');
    } finally { setLoading(false); }
  })();
}, [navigate]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    

    const handleSalvar = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from("clientes")
                .update({
                    telefone: dadosCliente.telefone,
                    email: dadosCliente.email,
                    rua: dadosCliente.rua,
                    numero: dadosCliente.numero,
                    bairro: dadosCliente.bairro,
                    cidade: dadosCliente.cidade,
                    estado: dadosCliente.estado,
                    cep: dadosCliente.cep,
                })
                .eq("id", cliente.id);

            if (error) throw error;

            toast.success("Dados atualizados com sucesso!");

            // Atualizar sessionStorage
            
        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar dados: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAlterarSenha = async () => {
  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) { toast.error("Preencha todos os campos de senha!"); return; }
  if (novaSenha.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres!"); return; }
  if (novaSenha !== confirmarNovaSenha) { toast.error("As senhas n�o coincidem!"); return; }
  try {
    setSaving(true);
    const res = await fetch('/api/clientes/password', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ current_password: senhaAtual, new_password: novaSenha })
    });
    if (res.status === 401) { toast.error('Senha atual incorreta!'); return; }
    if (!res.ok) throw new Error('password_change_failed');
    toast.success('Senha alterada com sucesso!');
    setSenhaAtual(''); setNovaSenha(''); setConfirmarNovaSenha(''); setMostrarAlterarSenha(false);
  } catch (e) {
    console.error('Erro ao alterar senha:', e);
    toast.error('Erro ao alterar senha');
  } finally { setSaving(false); }
};

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto space-y-6 py-8">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate("/area-cliente")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold dark:text-white">Meu Perfil</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Gerencie suas informações pessoais
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-2"
                    >
                        {darkMode ? (
                            <>
                                <Sun className="w-4 h-4" /> Claro
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4" /> Escuro
                            </>
                        )}
                    </Button>
                </div>

                {/* Dados pessoais */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Nome Completo</Label>
                                <Input
                                    value={dadosCliente.nome || ""}
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                                />
                            </div>
                            <div>
                                <Label>CPF/CNPJ</Label>
                                <Input
                                    value={dadosCliente.cpf_cnpj || ""}
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                                />
                            </div>

                            <div>
                                <Label>E-mail</Label>
                                <Input
                                    type="email"
                                    value={dadosCliente.email || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, email: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <Label>Telefone</Label>
                                <Input
                                    value={dadosCliente.telefone || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, telefone: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label>Rua</Label>
                                <Input
                                    value={dadosCliente.rua || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, rua: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <Label>Número</Label>
                                <Input
                                    value={dadosCliente.numero || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, numero: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <Label>Bairro</Label>
                                <Input
                                    value={dadosCliente.bairro || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, bairro: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <Label>Cidade</Label>
                                <Input
                                    value={dadosCliente.cidade || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, cidade: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <Input
                                    value={dadosCliente.estado || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, estado: e.target.value })
                                    }
                                    maxLength={2}
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>CEP</Label>
                                <Input
                                    value={dadosCliente.cep || ""}
                                    onChange={(e) =>
                                        setDadosCliente({ ...dadosCliente, cep: e.target.value })
                                    }
                                    className="dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSalvar}
                            disabled={saving}
                            className="w-full bg-green-500 hover:bg-green-600"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Segurança */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Segurança</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!mostrarAlterarSenha ? (
                            <Button
                                onClick={() => setMostrarAlterarSenha(true)}
                                variant="outline"
                                className="w-full"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Alterar Senha
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label>Senha Atual</Label>
                                    <Input
                                        type="password"
                                        value={senhaAtual}
                                        onChange={(e) => setSenhaAtual(e.target.value)}
                                        placeholder="Digite sua senha atual"
                                        className="dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <Label>Nova Senha</Label>
                                    <Input
                                        type="password"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                        placeholder="Digite a nova senha"
                                        className="dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <Label>Confirmar Nova Senha</Label>
                                    <Input
                                        type="password"
                                        value={confirmarNovaSenha}
                                        onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                                        placeholder="Confirme a nova senha"
                                        className="dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAlterarSenha}
                                        disabled={saving}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                                    >
                                        {saving ? "Alterando..." : "Confirmar Alteração"}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setMostrarAlterarSenha(false);
                                            setSenhaAtual("");
                                            setNovaSenha("");
                                            setConfirmarNovaSenha("");
                                        }}
                                        variant="outline"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}





