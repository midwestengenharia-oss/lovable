import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";


export default function LoginCliente() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !senha.trim()) {
            toast.error("Preencha e-mail e senha!");
            return;
        }

        try {
            setLoading(true);

            // Buscar cliente por e-mail
                        const res = await fetch("/api/clientes/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password: senha })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                if (j?.error === "invalid_credentials") toast.error("E-mail ou senha inválidos");
                else if (j?.error === "invitation_pending") toast.error("Cadastro não finalizado. Verifique seu e-mail/WhatsApp.");
                else toast.error("Erro ao fazer login");
                return;
            }
            const payload = await res.json();
            toast.success(`Bem-vindo, ${payload?.cliente?.nome || 'Cliente'}!`);

            // Redirecionar para Ã¡rea do cliente
            setTimeout(() => {
                navigate("/area-cliente");
            }, 1000);

        } catch (err: any) {
            console.error("Erro no login:", err);
            toast.error("Erro ao fazer login: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Login Cliente - Moreira Solar â˜€ï¸</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">E-mail</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Senha</label>
                            <Input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Digite sua senha"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Esqueceu sua senha?{" "}
                        <a href="/recuperar-senha" className="text-cyan-500 hover:underline">
                            Clique aqui
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
