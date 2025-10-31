import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-moreira.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated) navigate('/', { replace: true });
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        navigate('/', { replace: true });
      } else {
        let msg = 'Falha no login';
        try { const j = await res.json(); if (j?.error) msg = String(j.error); } catch {}
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border/40 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <img src={logo} alt="Moreira Solar" className="mx-auto h-16 w-auto mb-2" />
          <div>
            <CardTitle className="text-2xl font-semibold">Acesso Interno</CardTitle>
            <CardDescription>Entre com e-mail e senha</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-muted-foreground text-center">Portal do cliente: <a className="underline" href="/login-cliente">entrar</a></p>
        </CardFooter>
      </Card>
    </div>
  );
}
