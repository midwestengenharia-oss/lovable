import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import bcrypt from "bcryptjs";

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
                toast.error("Token inválido!");
                setLoading(false);
                return;
            }

            const tokenDecoded = decodeURIComponent(token);

            const { data, error } = await supabase
                .from("clientes")
                .select("*")
                .eq("convite_token", tokenDecoded.trim())
                .maybeSingle();

            if (error) {
                console.error("Erro Supabase:", error);
                toast.error("Erro ao buscar convite no banco.");
                setLoading(false);
                return;
            }

            if (!data) {
                toast.error("Convite não encontrado ou já utilizado.");
                setLoading(false);
                return;
            }


            const expiracao = new Date(data.convite_expira_em);
            if (new Date() > expiracao) {
                toast.error("O link de convite expirou.");
                setLoading(false);
                return;
            }

            setCliente(data);
            setLoading(false);
        };

        validarToken();
    }, [token]);

    const handleSubmit = async () => {
        if (!cliente) return;

        if (cliente.convite_aceito) {
            toast.error("Este convite já foi utilizado.");
            return;
        }

        if (!senha.trim()) {
            toast.error("A senha não pode estar vazia.");
            return;
        }

        if (senha.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            toast.error("As senhas não coincidem.");
            return;
        }

        try {
            setSubmitting(true);

            // 🔐 Gerar hash da senha
            const senhaHash = await bcrypt.hash(senha, 10);

            const { data, error } = await supabase
                .from("clientes")
                .update({
                    senha: senhaHash,
                    convite_aceito: true,
                    convite_token: null,
                    convite_expira_em: null,
                })
                .eq("id", cliente.id)
                .select(); // ← ADICIONE .select() para retornar os dados atualizados


            if (error) {
                console.error("❌ Erro no update:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error("Update não retornou dados. Verifique RLS.");
            }

            toast.success("Cadastro concluído com sucesso! Redirecionando...");

            setTimeout(() => {
                navigate("/login-cliente");
            }, 1500);

        } catch (err: any) {
            console.error("❌ Erro completo:", err);
            toast.error("Erro ao salvar: " + err.message);
        } finally {
            setSubmitting(false);
        }
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
                <p>Convite inválido ou expirado.</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Cadastro - Moreira Solar ☀️</CardTitle>
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
                            placeholder="Crie sua senha (mínimo 6 caracteres)"
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