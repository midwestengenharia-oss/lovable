import { useEffect, useMemo, useState } from "react";
import {
    useBoards,
    useColumnsByBoard,
    useFieldsByColumn,
    useUpsertField,
    useDeleteField,
    useSaveFieldsOrder,
    type Field,
} from "@/hooks/useStageAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { GripVertical, Plus, Pencil, Trash2, Save } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

function slugify(s: string) {
    return s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

const fieldTypes = [
    { id: "text", label: "Texto" },
    { id: "textarea", label: "Texto longo" },
    { id: "number", label: "Número" },
    { id: "date", label: "Data" },
    { id: "select", label: "Select" },
    { id: "radio", label: "Radio" },
    { id: "checkbox", label: "Checkbox (uma opção)" },
    { id: "boolean", label: "Sim/Não" },
    { id: "file", label: "Arquivo (meta)" },
] as const;

export default function AdminStageForms() {
    const { data: boards = [] } = useBoards();
    const [boardId, setBoardId] = useState<string | undefined>(undefined);
    const { data: columns = [] } = useColumnsByBoard(boardId);
    const [columnId, setColumnId] = useState<string | undefined>(undefined);

    const { data: fields = [], isLoading } = useFieldsByColumn(columnId);
    const [local, setLocal] = useState<Field[]>([]);

    useEffect(() => {
        setLocal(fields);
    }, [fields]);

    const upsert = useUpsertField(boardId || "", columnId || "");
    const del = useDeleteField(columnId || "");
    const saveOrder = useSaveFieldsOrder(columnId || "");

    const [dlgOpen, setDlgOpen] = useState(false);
    const [editing, setEditing] = useState<Field | null>(null);
    const [form, setForm] = useState<Partial<Field>>({ required: false, options: [] });

    const startCreate = () => {
        setEditing(null);
        setForm({
            key: "",
            label: "",
            type: "text",
            required: false,
            options: [],
            helper: "",
            active: true,
        } as any);
        setDlgOpen(true);
    };

    const startEdit = (f: Field) => {
        setEditing(f);
        setForm({
            id: f.id,
            key: f.key,
            label: f.label,
            type: f.type,
            required: f.required,
            options: f.options || [],
            helper: f.helper || "",
            active: f.active,
        });
        setDlgOpen(true);
    };

    const onDrop = (res: DropResult) => {
        if (!res.destination) return;
        const list = Array.from(local);
        const [item] = list.splice(res.source.index, 1);
        list.splice(res.destination.index, 0, item);
        setLocal(list);
    };

    const persistOrder = async () => {
        if (!columnId) return;
        try {
            await saveOrder.mutateAsync(local);
            toast.success("Ordem salva");
        } catch (e: any) {
            toast.error(e?.message || "Erro ao salvar ordem");
        }
    };

    const parseOptions = (raw: string) => {
        if (!raw.trim()) return [];
        try {
            const js = JSON.parse(raw);
            return Array.isArray(js) ? js : [];
        } catch {
            // permite CSV simples
            return raw.split(",").map((s) => s.trim()).filter(Boolean);
        }
    };

    const optionsText = useMemo(
        () => (form.options && (form.options as any[]).length ? JSON.stringify(form.options) : ""),
        [form.options]
    );

    const onSubmit = async () => {
        if (!boardId || !columnId) {
            toast.error("Selecione um board e uma coluna.");
            return;
        }
        try {
            const payload: Partial<Field> = {
                id: editing?.id,
                board_id: boardId,
                column_id: columnId,
                key: form.key?.trim() || slugify(form.label || ""),
                label: form.label?.trim() || "",
                type: form.type!,
                required: !!form.required,
                options: form.options || [],
                helper: form.helper || null,
                active: form.active ?? true,
            };
            await upsert.mutateAsync(payload);
            toast.success(editing ? "Campo atualizado" : "Campo criado");
            setDlgOpen(false);
        } catch (e: any) {
            toast.error(e?.message || "Erro ao salvar campo");
        }
    };

    const onDelete = async (id?: string) => {
        if (!id) {
            toast.error("ID do campo inválido");
            return;
        }
        if (!confirm("Remover este campo? Os valores associados também serão excluídos.")) return;
        try {
            await del.mutateAsync(id);
            toast.success("Campo removido");
        } catch (e: any) {
            toast.error(e?.message || "Erro ao remover");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Admin · Formulários da Fase</h1>
                <p className="text-muted-foreground">Defina os campos (processos) que devem ser preenchidos em cada etapa do Kanban.</p>
            </div>

            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Board</Label>
                        <Select value={boardId} onValueChange={(v) => { setBoardId(v); setColumnId(undefined); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione um board" /></SelectTrigger>
                            <SelectContent>
                                {boards.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name} ({b.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Coluna (fase)</Label>
                        <Select value={columnId} onValueChange={setColumnId} disabled={!boardId}>
                            <SelectTrigger><SelectValue placeholder="Selecione a fase" /></SelectTrigger>
                            <SelectContent>
                                {columns.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button disabled={!columnId} onClick={startCreate}>
                            <Plus className="h-4 w-4 mr-2" /> Novo campo
                        </Button>
                        <Button variant="secondary" disabled={!columnId || isLoading} onClick={persistOrder}>
                            <Save className="h-4 w-4 mr-2" /> Salvar ordem
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista + DnD */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campos da fase</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!columnId ? (
                            <p className="text-sm text-muted-foreground">Selecione um board e uma coluna.</p>
                        ) : (
                            <DragDropContext onDragEnd={onDrop}>
                                <Droppable droppableId="fields">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                            {local.map((f, i) => (
                                                <Draggable key={f.id!} draggableId={f.id!} index={i}>
                                                    {(prov) => (
                                                        <div
                                                            ref={prov.innerRef}
                                                            {...prov.draggableProps}
                                                            className="flex items-center justify-between p-3 border rounded-md bg-card"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    {...prov.dragHandleProps}
                                                                    className="text-muted-foreground cursor-grab"
                                                                >
                                                                    <GripVertical size={16} />
                                                                </span>
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {f.label}{" "}
                                                                        <span className="text-muted-foreground text-xs">
                                                                            ({f.key})
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {f.type} · ord {f.ord}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {f.required && <Badge variant="secondary">Obrigatório</Badge>}
                                                                <Button size="icon" variant="ghost" onClick={() => startEdit(f)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => onDelete(f.id)}
                                                                    disabled={!f.id}
                                                                    title="Remover campo"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </CardContent>
                </Card>

                {/* Pré-visualização simples */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pré-visualização</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!columnId ? (
                            <p className="text-sm text-muted-foreground">Selecione uma fase para visualizar.</p>
                        ) : (
                            local.map((f) => (
                                <div key={f.id} className="grid grid-cols-4 gap-3 items-start">
                                    <Label className="col-span-1">
                                        {f.label} {f.required && <span className="text-destructive">*</span>}
                                        {f.helper && <div className="text-xs text-muted-foreground">{f.helper}</div>}
                                    </Label>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        {f.type}
                                        {Array.isArray(f.options) && f.options?.length
                                            ? ` · opções: ${f.options.length}`
                                            : ""}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog criar/editar */}
            <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Editar campo" : "Novo campo"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Label</Label>
                                <Input
                                    value={form.label || ""}
                                    onChange={(e) => {
                                        const label = e.target.value;
                                        setForm((prev) => ({
                                            ...prev,
                                            label,
                                            key: prev.key || slugify(label),
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Key</Label>
                                <Input
                                    value={form.key || ""}
                                    onChange={(e) => setForm({ ...form, key: slugify(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Tipo</Label>
                                <Select
                                    value={(form.type as string) || ""}
                                    onValueChange={(v) => setForm({ ...form, type: v as Field["type"] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fieldTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Checkbox
                                    id="req"
                                    checked={!!form.required}
                                    onCheckedChange={(ck) => setForm({ ...form, required: !!ck })}
                                />
                                <Label htmlFor="req">Obrigatório</Label>
                            </div>
                        </div>

                        <div>
                            <Label>Ajuda (opcional)</Label>
                            <Input
                                value={form.helper || ""}
                                onChange={(e) => setForm({ ...form, helper: e.target.value })}
                            />
                        </div>

                        {(form.type === "select" || form.type === "radio" || form.type === "checkbox") && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Opções (JSON ou lista separada por vírgulas)</Label>
                                    <textarea
                                        className="w-full border rounded-md p-2 min-h-[100px] font-mono text-xs"
                                        placeholder='Ex.: ["Aéreo","Subterrâneo"] ou [{ "label":"Aéreo","value":"aereo"}]'
                                        value={optionsText}
                                        onChange={(e) =>
                                            setForm({ ...form, options: parseOptions(e.target.value) })
                                        }
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        Dica: se usar objetos, o painel usa <code>label</code> e <code>value</code>.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDlgOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={onSubmit}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
