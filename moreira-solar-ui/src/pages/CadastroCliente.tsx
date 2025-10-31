import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CadastroCliente() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
  const validarToken = async () => {
    if (!token) {
      toast.error("Token inv·lido!");
      setLoading(false);
      return;
    }
    const tokenDecoded = decodeURIComponent(token);
    try {
      const res = await fetch('/api/clientes/convite/' + encodeURIComponent(tokenDecoded), { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) toast.error('Convite n„o encontrado ou j· utilizado.');
        else toast.error('Erro ao buscar convite.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const expiracao = data?.convite_expira_em ? new Date(data.convite_expira_em) : null;
      if (expiracao && new Date() > expiracao) {
        toast.error('O link de convite expirou.');
        setLoading(false);
        return;
      }
      setCliente(data);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao validar convite.');
    }
    setLoading(false);
  };
  validarToken();
}, [token]);

    const handleSubmit = async () => {
  if (!cliente) return;
  if (cliente.convite_aceito) { toast.error('Este convite j· foi utilizado.'); return; }
  if (!senha.trim()) { toast.error('A senha n„o pode estar vazia.'); return; }
  if (senha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
  if (senha !== confirmarSenha) { toast.error('As senhas n„o coincidem.'); return; }
  try {
    setSubmitting(true);
    const res = await fetch('/api/clientes/convite/' + encodeURIComponent(cliente.convite_token) + '/aceitar', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: senha })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Falha ao concluir cadastro');
    }
    toast.success('Cadastro concluÌdo com sucesso! Redirecionando...');
    setTimeout(() => navigate('/login-cliente'), 1500);
  } catch (err) {
    console.error(err);
    toast.error('Erro ao salvar');
  } finally { setSubmitting(false); }
};

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Validando link...</p>
            </div>
        );
    }

    if (!cliente) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Convite inv√°lido ou expirado.</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Cadastro - Moreira Solar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Nome</label>
                        <Input
                            value={cliente?.nome || ""}
                            disabled
                            className="bg-gray-800 text-white border-gray-700 opacity-100"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">E-mail</label>
                        <Input
                            value={cliente?.email || ""}
                            disabled
                            className="bg-gray-800 text-white border-gray-700 opacity-100"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Telefone</label>
                        <Input
                            value={cliente?.telefone || ""}
                            disabled
                            className="bg-gray-800 text-white border-gray-700 opacity-100"
                        />
                    </div>

                    <div className="pt-4">
                        <label className="text-sm text-gray-400 block mb-1">Senha</label>
                        <Input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Crie sua senha (m√≠nimo 6 caracteres)"
                            className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Confirmar Senha</label>
                        <Input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Confirme sua senha"
                            className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-500"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600"
                    >
                        {submitting ? "Salvando..." : "Concluir Cadastro"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}












