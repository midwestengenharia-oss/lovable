import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Building2, Home } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface UCPreviewTableProps {
    ucs: any[];
    selectedUCs: string[];
    onToggleSelect: (ucs: string[]) => void;
}

export function UCPreviewTable({ ucs, selectedUCs, onToggleSelect }: UCPreviewTableProps) {
    const isAllSelected = ucs.length > 0 && selectedUCs.length === ucs.length;

    const handleToggleAll = () => {
        if (isAllSelected) {
            onToggleSelect([]);
        } else {
            onToggleSelect(ucs.map(uc => uc.numero_instalacao));
        }
    };

    const handleToggleOne = (numeroUC: string) => {
        if (selectedUCs.includes(numeroUC)) {
            onToggleSelect(selectedUCs.filter(n => n !== numeroUC));
        } else {
            onToggleSelect([...selectedUCs, numeroUC]);
        }
    };

    const getUCIcon = (tipo?: string) => {
        switch (tipo) {
            case 'geradora': return <Zap className="h-4 w-4 text-green-600" />;
            case 'beneficiaria': return <Building2 className="h-4 w-4 text-blue-600" />;
            default: return <Home className="h-4 w-4 text-gray-600" />;
        }
    };

    const getUCBadge = (tipo?: string, existeNoBanco?: boolean) => {
        return (
            <div className="flex items-center gap-2">
                {getUCIcon(tipo)}
                {existeNoBanco && (
                    <Badge variant="outline" className="text-xs">
                        🔄 Atualizar
                    </Badge>
                )}
                {!existeNoBanco && (
                    <Badge variant="outline" className="text-xs bg-green-50">
                        🆕 Nova
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Unidades Consumidoras</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAll}
                    >
                        {isAllSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleToggleAll}
                                    />
                                </TableHead>
                                <TableHead>Número UC</TableHead>
                                <TableHead>Cidade/UF</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ucs.map((uc) => (
                                <TableRow key={uc.numero_instalacao}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUCs.includes(uc.numero_instalacao)}
                                            onCheckedChange={() => handleToggleOne(uc.numero_instalacao)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {uc.numero_instalacao}
                                    </TableCell>
                                    <TableCell>
                                        {uc.cidade}/{uc.uf}
                                    </TableCell>
                                    <TableCell>
                                        {getUCBadge(uc.tipo_uc, uc.existeNoBanco)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {uc.status || 'Ativa'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}