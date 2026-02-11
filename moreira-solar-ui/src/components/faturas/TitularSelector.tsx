import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Plus } from "lucide-react";

interface TitularSelectorProps {
    cpfGestor: string;
    onTitularSelected: (titular: any) => void;
    matches?: any[];
    suggestion?: any;
}

export function TitularSelector({
    cpfGestor,
    onTitularSelected,
    matches = [],
    suggestion
}: TitularSelectorProps) {
    const [mode, setMode] = useState<'existing' | 'new'>(
        suggestion ? 'existing' : 'new'
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");

    const handleSelectExisting = () => {
        if (suggestion) {
            onTitularSelected(suggestion);
        }
    };

    const handleCreateNew = () => {
        onTitularSelected({
            nome: nome || `Titular ${cpfGestor}`,
            cpfCnpj: cpfGestor,
            email,
            novo: true,
        });
    };

    return (
        <div className="space-y-4">
            <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)}>
                <div className="space-y-4">
                    {/* Opção: Usar Existente */}
                    <Card className={mode === 'existing' ? 'border-primary' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="existing" id="existing" />
                                <div className="flex-1 space-y-3">
                                    <Label htmlFor="existing" className="text-base font-semibold">
                                        Usar titular existente
                                    </Label>

                                    {suggestion && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                            <p className="text-sm font-medium text-green-900">
                                                ✅ Sugestão: {suggestion.nome}
                                            </p>
                                            <p className="text-xs text-green-700">
                                                CPF: {suggestion.cpfCnpj}
                                            </p>
                                            <Button
                                                size="sm"
                                                className="mt-2"
                                                onClick={handleSelectExisting}
                                                disabled={mode !== 'existing'}
                                            >
                                                Selecionar este titular
                                            </Button>
                                        </div>
                                    )}

                                    {!suggestion && (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Buscar por nome ou CPF..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9"
                                                    disabled={mode !== 'existing'}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Nenhum titular encontrado com este CPF
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Opção: Criar Novo */}
                    <Card className={mode === 'new' ? 'border-primary' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="new" id="new" />
                                <div className="flex-1 space-y-3">
                                    <Label htmlFor="new" className="text-base font-semibold">
                                        Criar novo titular
                                    </Label>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Nome *</Label>
                                            <Input
                                                placeholder="Nome do titular"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                                disabled={mode !== 'new'}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs">CPF/CNPJ</Label>
                                            <Input
                                                value={cpfGestor}
                                                disabled
                                                className="bg-muted"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs">Email (opcional)</Label>
                                            <Input
                                                type="email"
                                                placeholder="email@exemplo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={mode !== 'new'}
                                            />
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={handleCreateNew}
                                            disabled={mode !== 'new' || !nome}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Criar e continuar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </RadioGroup>
        </div>
    );
}