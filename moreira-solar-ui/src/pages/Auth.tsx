import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import logo from "@/assets/logo-moreira.png";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiGet<{ authenticated: boolean }>("/api/auth/session");
      if (!mounted) return;
      if (res.ok && res.data.authenticated) navigate("/", { replace: true });
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const gotoLogin = () => { navigate('/login'); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border/40 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <img src={logo} alt="Moreira Solar" className="mx-auto h-16 w-auto mb-2" />
          <div>
            <CardTitle className="text-2xl font-semibold">Sistema Moreira Solar</CardTitle>
            <CardDescription>GestÃ£o interna de energia solar</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4" />
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={gotoLogin} className="w-full">Entrar com SSO</Button>
          <p className="text-xs text-muted-foreground text-center">Acesso restrito a usuários internos da Moreira Solar</p>
        </CardFooter>
      </Card>
    </div>
  );
}


