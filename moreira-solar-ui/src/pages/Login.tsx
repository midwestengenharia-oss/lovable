import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoMoreira from "@/assets/logo-moreira.png";
import { supabase } from "@/lib/supabase"; // ⚙️ Certifique-se de usar o mesmo client importado em useOrcamentos

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Melhoria: Restaura o sessionStorage caso o usuário já tenha sessão ativa (evita bug ao atualizar)
  useEffect(() => {
    const restaurarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      const sessao = data?.session;
      if (sessao?.user && !sessionStorage.getItem("usuario_logado")) {
        const user = sessao.user;
        const meta = user.user_metadata || {};
        const usuario_logado = {
          id: user.id,
          nome: meta.nome || "Usuário",
          tipo: meta.perfil || "vendedor",
          email: user.email,
        };
        sessionStorage.setItem("usuario_logado", JSON.stringify(usuario_logado));
      }
    };
    restaurarSessao();
  }, []);

  // ✅ Se já estiver logado, redireciona automaticamente
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // ==== Função de Login ====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Preencha email e senha");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, senha);
    setIsLoading(false);

    if (!error) {
      try {
        // ✅ Pega a sessão atual do Supabase
        const { data } = await supabase.auth.getSession();

        if (data?.session?.user) {
          const user = data.session.user;
          const meta = user.user_metadata || {};

          // ✅ Cria o objeto esperado pelos hooks (como useOrcamentos)
          const usuario_logado = {
            id: user.id,
            nome: meta.nome || "Usuário",
            tipo: meta.perfil || "vendedor", // admin | gestor | vendedor
            email: user.email,
          };

          // ✅ Salva no sessionStorage
          sessionStorage.setItem("usuario_logado", JSON.stringify(usuario_logado));
        } else {
          console.warn("⚠️ Nenhum usuário retornado da sessão Supabase.");
        }
      } catch (err) {
        console.error("❌ Erro ao salvar usuário no sessionStorage:", err);
      }

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } else {
      toast.error("Email ou senha incorretos: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logoMoreira} alt="Moreira Solar" className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl">Sistema de Gestão Solar</CardTitle>
            <CardDescription>Entre com suas credenciais para acessar</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lembrar"
                checked={lembrar}
                onCheckedChange={(checked) => setLembrar(checked as boolean)}
              />
              <label
                htmlFor="lembrar"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar-me
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Primeira vez?</strong> Crie sua conta na página de cadastro ou faça login com suas credenciais do Supabase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
