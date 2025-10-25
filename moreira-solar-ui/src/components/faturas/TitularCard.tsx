import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, Calendar } from "lucide-react";
import { TitularEnergia, UnidadeConsumidora } from "@/contexts/AppContext";
import { formatarCPFCNPJ, formatarTelefone } from "@/lib/validators";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TitularCardProps {
  titular: TitularEnergia;
  unidades: UnidadeConsumidora[];
  onVerUnidades: () => void;
}

export function TitularCard({ titular, unidades, onVerUnidades }: TitularCardProps) {
  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const countByTipo = () => {
    const geradoras = unidades.filter((u) => 
      u.tipo === "geradora_financiamento" || u.tipo === "geradora_investimento"
    ).length;
    const beneficiarias = unidades.filter((u) => 
      u.tipo === "beneficiaria_acr" || u.tipo === "beneficiaria_associacao"
    ).length;
    return { geradoras, beneficiarias };
  };

  const { geradoras, beneficiarias } = countByTipo();

  const getConcessionariaBadge = () => {
    const colors: Record<string, string> = {
      energisa: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      cemig: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      copel: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      celpe: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      outras: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    
    return (
      <Badge className={colors[titular.concessionaria]}>
        {titular.concessionaria.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(titular.nome)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{titular.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {formatarCPFCNPJ(titular.cpfCnpj)}
              </p>
              <div className="mt-1">
                {getConcessionariaBadge()}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>
                  {unidades.length} UC(s) · {geradoras} Geradoras · {beneficiarias} Beneficiárias
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{formatarTelefone(titular.telefone)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{titular.email}</span>
              </div>
              
              {titular.ultimoAcesso && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Último acesso: {formatDistanceToNow(new Date(titular.ultimoAcesso), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onVerUnidades}
            >
              Ver Unidades
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
