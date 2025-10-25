import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnidadeConsumidora, VinculoCompensacao, TitularEnergia } from "@/contexts/AppContext";
import { Factory, Home, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompensacaoGraphProps {
  unidades: UnidadeConsumidora[];
  vinculos: VinculoCompensacao[];
  titulares: TitularEnergia[];
  onNodeClick: (ucId: string) => void;
}

export function CompensacaoGraph({ unidades, vinculos, titulares, onNodeClick }: CompensacaoGraphProps) {
  const [selectedUGI, setSelectedUGI] = useState<string>("todas");
  const [loading] = useState(false);

  const ugis = unidades.filter((u) => u.tipo === "geradora_investimento");
  const ucbs = unidades.filter((u) => u.tipo.startsWith("beneficiaria_"));

  const vinculosFiltrados = selectedUGI === "todas" 
    ? vinculos.filter((v) => v.ativo)
    : vinculos.filter((v) => v.ativo && v.ugiId === selectedUGI);

  const ucbsVinculadas = ucbs.filter((u) => vinculosFiltrados.some((v) => v.ucbId === u.id));
  const ugisVinculadas = selectedUGI === "todas" 
    ? ugis.filter((u) => vinculosFiltrados.some((v) => v.ugiId === u.id))
    : ugis.filter((u) => u.id === selectedUGI);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Rede de Compensação</CardTitle>
        <Select value={selectedUGI} onValueChange={setSelectedUGI}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por geradora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Geradoras</SelectItem>
            {ugis.map((ugi) => (
              <SelectItem key={ugi.id} value={ugi.id}>
                {ugi.apelido || ugi.numeroUC}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative h-[500px] bg-muted/20 rounded-lg p-8 overflow-auto">
          {/* Simplified SVG Network Graph */}
          <svg width="100%" height="100%" viewBox="0 0 800 500" className="w-full h-full">
            <defs>
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Draw Links */}
            {vinculosFiltrados.map((vinculo, idx) => {
              const ugiIndex = ugisVinculadas.findIndex((u) => u.id === vinculo.ugiId);
              const ucbIndex = ucbsVinculadas.findIndex((u) => u.id === vinculo.ucbId);
              
              if (ugiIndex === -1 || ucbIndex === -1) return null;

              const x1 = 150;
              const y1 = 100 + ugiIndex * 120;
              const x2 = 650;
              const y2 = 100 + ucbIndex * 100;
              
              const strokeWidth = Math.max(2, vinculo.percentualCompensacao / 10);

              return (
                <g key={vinculo.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#linkGradient)"
                    strokeWidth={strokeWidth}
                    opacity={0.7}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    fill="hsl(var(--foreground))"
                    fontSize="12"
                    textAnchor="middle"
                    className="font-semibold"
                  >
                    {vinculo.percentualCompensacao}%
                  </text>
                </g>
              );
            })}

            {/* Draw UGI Nodes (Left side) */}
            {ugisVinculadas.map((ugi, idx) => {
              const y = 100 + idx * 120;
              return (
                <g
                  key={ugi.id}
                  onClick={() => onNodeClick(ugi.id)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <circle cx={150} cy={y} r={35} fill="hsl(var(--primary))" opacity={0.9} />
                  <foreignObject x={130} y={y - 10} width={40} height={40}>
                    <div className="flex items-center justify-center h-full">
                      <Factory className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </foreignObject>
                  <text
                    x={150}
                    y={y + 55}
                    fill="hsl(var(--foreground))"
                    fontSize="12"
                    textAnchor="middle"
                    className="font-semibold"
                  >
                    {ugi.apelido || ugi.numeroUC}
                  </text>
                </g>
              );
            })}

            {/* Draw UCB Nodes (Right side) */}
            {ucbsVinculadas.map((ucb, idx) => {
              const y = 100 + idx * 100;
              const Icon = ucb.tipo === "beneficiaria_acr" ? Home : Users;
              return (
                <g
                  key={ucb.id}
                  onClick={() => onNodeClick(ucb.id)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <circle cx={650} cy={y} r={30} fill="hsl(var(--accent))" opacity={0.9} />
                  <foreignObject x={633} y={y - 8} width={34} height={34}>
                    <div className="flex items-center justify-center h-full">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                  </foreignObject>
                  <text
                    x={650}
                    y={y + 50}
                    fill="hsl(var(--foreground))"
                    fontSize="11"
                    textAnchor="middle"
                    className="font-medium"
                  >
                    {ucb.apelido || ucb.numeroUC}
                  </text>
                </g>
              );
            })}
          </svg>

          {vinculosFiltrados.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum vínculo de compensação encontrado</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span>Geradora Investimento (UGI)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent" />
            <span>Beneficiárias (UCB)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
