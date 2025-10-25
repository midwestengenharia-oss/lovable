import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

export default function Perfil() {
  const { profile, isLoading } = useUserProfile();

  const handleReloadSeed = () => {
    if (confirm("Tem certeza? Isso apagará todos os dados atuais e carregará dados de exemplo.")) {
      // TODO: Implement seed reload functionality with Supabase
      console.log("TODO: Reload seed data");
      toast.info("Funcionalidade de recarregar dados em desenvolvimento");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={profile?.nome || "N/A"} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={profile?.email || "N/A"} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil</Label>
            <Input id="perfil" value={profile?.perfil?.toUpperCase() || "N/A"} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Moeda</Label>
              <p className="text-sm text-muted-foreground">BRL (R$)</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Idioma</Label>
              <p className="text-sm text-muted-foreground">Português (Brasil)</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="persist">Persistir Dados Localmente</Label>
              <p className="text-sm text-muted-foreground">Salvar no navegador (localStorage)</p>
            </div>
            <Switch id="persist" defaultChecked disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleReloadSeed}>
            Recarregar Seed de Dados
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Isso apagará todos os dados atuais e carregará dados de exemplo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
