import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-moreira.png";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVerifying = useRef(false); // 🚦 Flag para bloquear redirect durante verificação

  // 🔁 Redireciona se já estiver logado (MAS NÃO durante verificação)
  useEffect(() => {
    if (user && !isVerifying.current) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Preencha o email e a senha");
      return;
    }

    setIsLoading(true);
    isVerifying.current = true; // 🚦 Ativa a flag de verificação

    try {
      // 🔐 Faz login direto no Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login: " + authError.message);
        }
        setIsLoading(false);
        isVerifying.current = false;
        return;
      }

      if (!authData?.user) {
        toast.error("Erro ao processar login");
        setIsLoading(false);
        isVerifying.current = false;
        return;
      }

      // 🔒 VERIFICAÇÃO IMEDIATA DE USUÁRIO ATIVO
      const { data: perfil, error: erroConsulta } = await supabase
        .from("profiles")
        .select("ativo, nome, perfil")
        .eq("id", authData.user.id)
        .single();

      if (erroConsulta) {
        console.error("❌ Erro ao buscar perfil:", erroConsulta);
        toast.error("Erro ao verificar dados do usuário");
        await supabase.auth.signOut();
        setIsLoading(false);
        isVerifying.current = false;
        return;
      }

      // ⛔ SE INATIVO: Bloqueia TOTALMENTE
      if (perfil?.ativo === false) {
        console.log("⛔ Usuário inativo detectado - bloqueando acesso");

        // Faz logout e aguarda completar
        await supabase.auth.signOut();

        toast.error("Sua conta está inativa. Entre em contato com o administrador.");
        setIsLoading(false);
        isVerifying.current = false;

        // Limpa os campos
        setLoginEmail("");
        setLoginPassword("");
        return;
      }

      // ✅ Usuário ATIVO - permite o acesso
      console.log("✅ Usuário ativo - permitindo acesso");
      isVerifying.current = false; // 🚦 Libera o redirect
      toast.success("Login realizado com sucesso!");
      setIsLoading(false);

      // Força o redirect imediatamente
      navigate("/", { replace: true });

    } catch (err) {
      console.error("❌ Erro no processo de login:", err);
      toast.error("Erro ao processar login");
      await supabase.auth.signOut();
      setIsLoading(false);
      isVerifying.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border/40 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <img
            src={logo}
            alt="Moreira Solar"
            className="mx-auto h-16 w-auto mb-2"
          />
          <div>
            <CardTitle className="text-2xl font-semibold">
              Sistema Moreira Solar
            </CardTitle>
            <CardDescription>Gestão interna de energia solar</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Verificando...</span>
                </div>
              ) : (
                "Entrar"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Acesso restrito a usuários internos da Moreira Solar
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}