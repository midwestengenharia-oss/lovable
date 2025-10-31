import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ChooseAccess() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-gray-50 via-white to-primary/10">
      <div className="grid gap-6 w-full max-w-2xl md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Acesso Interno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Para colaboradores da Moreira Solar.</p>
            <Button className="w-full" onClick={() => navigate('/login')}>Entrar</Button>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Portal do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Acesso aos dados do seu contrato e projetos.</p>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/login-cliente')}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


