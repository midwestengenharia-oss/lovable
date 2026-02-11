import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportProgressProps {
    progress: {
        total: number;
        processadas: number;
        sucesso: number;
        erros: number;
        percentual: number;
        logs: Array<{
            timestamp: Date;
            tipo: 'info' | 'success' | 'error' | 'warning';
            mensagem: string;
        }>;
    };
}

export function ImportProgress({ progress }: ImportProgressProps) {
    const getLogIcon = (tipo: string) => {
        switch (tipo) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
            default: return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Progresso</span>
                            <span className="font-semibold">
                                {progress.processadas} / {progress.total} ({progress.percentual}%)
                            </span>
                        </div>
                        <Progress value={progress.percentual} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-green-600">{progress.sucesso}</p>
                            <p className="text-xs text-muted-foreground">Sucesso</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{progress.erros}</p>
                            <p className="text-xs text-muted-foreground">Erros</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-600">
                                {progress.total - progress.processadas}
                            </p>
                            <p className="text-xs text-muted-foreground">Pendentes</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm font-medium mb-3">Log de Atividades</p>
                    <ScrollArea className="h-[200px] rounded border">
                        <div className="p-4 space-y-2">
                            {progress.logs.map((log, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                    {getLogIcon(log.tipo)}
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </p>
                                        <p>{log.mensagem}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}