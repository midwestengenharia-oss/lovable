
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Supabase removido deste módulo; usamos o BFF via fetch com cookies
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, GripVertical, Edit3, Trash2, Wand2, MoveRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

type Board = { id: string; slug: string; name: string; entity: string; active: boolean };
type Column = {
    id: string; board_id: string; key: string; title: string; ord: number;
    terminal: boolean; active: boolean; wip_limit: number | null; sla_days: number | null;
    color_header: string | null; color_badge: string | null;
    update_patch?: any | null;            // 👈 ADICIONE ISTO
};

type Transition = { id: string; board_id: string; from_column_id: string; to_column_id: string };

// ---------------- guards (login/perfil) ----------------
function useMe() {
    return useQuery({
        queryKey: ["auth", "session"],
        queryFn: async () => {
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao obter sessão');
            const j = await res.json();
            return j.user;
        },
    });
}
function useMyProfile() {
    return useQuery({
        queryKey: ["auth", "profile"],
        queryFn: async () => {
            const res = await fetch('/api/me', { credentials: 'include' });
            if (res.status === 401) return null;
            if (!res.ok) throw new Error('Falha ao obter perfil');
            return await res.json();
        },
    });
}
const ManagerGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: user } = useMe();
    const { data: profile, isLoading } = useMyProfile();
    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Verificando permissões…</div>;
    if (!user) return <div className="p-6 text-sm flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Faça login para continuar.</div>;
    if (!profile?.ativo || !["gestor", "admin"].includes(String(profile?.perfil))) {
        return <div className="p-6 text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Acesso restrito a gestores e admins.</div>;
    }
    return <>{children}</>;
};

// ---------------- queries/mutations ----------------
function useBoards() {
    return useQuery({
        queryKey: ["kanban", "boards"],
        queryFn: async (): Promise<Board[]> => {
            const res = await fetch('/api/kanban/boards', { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar boards');
            return (await res.json()) as any;
        },
    });
}
function useColumns(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "columns", boardId],
        queryFn: async (): Promise<Column[]> => {
            const res = await fetch(`/api/kanban/columns?boardId=${boardId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar colunas');
            return (await res.json()) as any;
        },
    });
}
function useTransitions(boardId?: string) {
    return useQuery({
        enabled: !!boardId,
        queryKey: ["kanban", "transitions", boardId],
        queryFn: async (): Promise<Transition[]> => {
            const res = await fetch(`/api/kanban/transitions?boardId=${boardId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao carregar transições');
            return (await res.json()) as any;
        },
    });
}

function useUpsertBoard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Board>) => {
            const res = await fetch('/api/kanban/boards', {
                method: 'POST',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Falha ao salvar board');
            return (await res.json()) as Board;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", "boards"] }),
    });
}
function useDeleteBoard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/kanban/boards/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao excluir board');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", "boards"] }),
    });
}
function useUpsertColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Column>) => {
            const body = { ...payload, board_id: boardId } as any;
            // BFF: upsert column (create/update handled server-side)
            if (!body.title || !body.key) {
                throw new Error("Informe título e chave (key) da coluna.");
            }
            const resBff = await fetch('/api/kanban/columns', {
                method: 'POST',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!resBff.ok) throw new Error('Falha ao salvar coluna');
            return (await resBff.json()) as Column;

            // edição: tem id -> UPDATE (não mexe no ord)
            if (body.id) {
                const { id, board_id, ...rest } = body;

                // segurança: não permitir sobrescrever campos críticos sem querer
                delete rest.ord;           // ord só muda pela tela "Salvar ordem"
                if (rest.key === undefined) delete rest.key;
                if (rest.title === undefined) delete rest.title;

                // (migrado para BFF)
                // const { data, error } = await supabase
                //     .from("kanban_column")
                //     .update(rest)
                //     .eq("id", id)
                //     .eq("board_id", boardId)
                //     .select()
                //     .single();
                // if (error) throw error;
                // return data as Column;
                throw new Error('handled by BFF above');
            }

            // criação: não tem id -> INSERT completo (com ord calculado)
            if (!body.title || !body.key) {
                throw new Error("Informe título e chave (key) da coluna.");
            }

            // pega o último 'ord' e soma 1
            // migrado para BFF

            body.ord = (last?.ord ?? 0) + 1;
            body.id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

            // migrado para BFF
            throw new Error('handled by BFF above');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", "columns", boardId] })
    });
}

function useDeleteColumn(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/kanban/columns/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error('Falha ao excluir coluna');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", "columns", boardId] }),
    });
}
function useSaveOrder(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (cols: Column[]) => {
            // validação
            const invalid = cols.filter(c => !c.id || !c.key);
            if (invalid.length) {
            // BFF: salva ordem das colunas
            const ids = cols.map(c => c.id);
            const resOrder = await fetch('/api/kanban/columns/order', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ boardId, ids })
            });
            if (!resOrder.ok) throw new Error('Falha ao salvar ordem das colunas');
            return;
                throw new Error(
                    "Há colunas sem id/key. Edite e salve cada coluna antes de ordenar."
                );
            }

            // 1ª passada: atribui ord temporário NEGATIVO único para evitar colisão
            // migrado para BFF: ver chamada acima

            // 2ª passada: aplica ordem final 1..N
            // migrado para BFF: ver chamada acima
        },
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["kanban", "columns", boardId] }),
    });
}


function useToggleTransition(boardId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (p: { from: string; to: string; enable: boolean }) => {
            if (p.enable) {
                const res = await fetch('/api/kanban/transitions', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ board_id: boardId, from_column_id: p.from, to_column_id: p.to }) });
                if (!res.ok) throw new Error('Falha ao criar transição');
            } else {
                const res = await fetch(`/api/kanban/transitions?boardId=${boardId}&from=${p.from}&to=${p.to}`, { method: 'DELETE', credentials: 'include' });
                if (!res.ok) throw new Error('Falha ao remover transição');
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", "transitions", boardId] }),
    });
}

// ---------------- dialogs ----------------
function BoardDialog({
    open,
    onOpenChange,
    initial,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initial?: Partial<Board> | null;
    onSubmit: (b: Partial<Board>) => void;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [slug, setSlug] = useState(initial?.slug ?? "");
    const [entity, setEnt] = useState(initial?.entity ?? "projetos");
    const [active, setAct] = useState(initial?.active ?? true);
    useEffect(() => {
        setName(initial?.name ?? "");
        setSlug(initial?.slug ?? "");
        setEnt(initial?.entity ?? "projetos");
        setAct(initial?.active ?? true);
    }, [initial]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initial?.id ? "Editar board" : "Novo board"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                    <div className="grid gap-1">
                        <Label>Nome</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                        <Label>Slug</Label>
                        <div className="flex gap-2">
                            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
                            <Button variant="secondary" type="button" onClick={() => setSlug(slugify(name))}>
                                <Wand2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <Label>Entidade</Label>
                        <Input value={entity} onChange={(e) => setEnt(e.target.value)} placeholder="projetos | orcamentos | leads" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={active} onCheckedChange={(v) => setAct(Boolean(v))} />{" "}
                        <span className="text-sm text-muted-foreground">Ativo</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            if (!name.trim() || !slug.trim()) return toast.error("Nome e slug são obrigatórios");
                            onSubmit({ ...(initial?.id ? { id: initial.id } : {}), name, slug, entity, active });
                            onOpenChange(false);
                        }}
                    >
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ColumnDialog({
    open,
    onOpenChange,
    initial,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initial?: Partial<Column> | null;
    onSubmit: (c: Partial<Column>) => void;
}) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [key, setKey] = useState(initial?.key ?? "");
    const [terminal, setTerminal] = useState(!!initial?.terminal);
    const [active, setActive] = useState(initial?.active ?? true);
    const [wip, setWip] = useState<string>(initial?.wip_limit?.toString?.() ?? "");
    const [sla, setSla] = useState<string>(initial?.sla_days?.toString?.() ?? "");
    const [hdr, setHdr] = useState<string>(initial?.color_header ?? "#f8fafc");
    const [bdg, setBdg] = useState<string>(initial?.color_badge ?? "#e5e7eb");

    // 👇 estado correto para o patch JSON
    const [colPatch, setColPatch] = useState<string>(() => {
        try { return JSON.stringify(initial?.update_patch ?? {}, null, 2); }
        catch { return "{}"; }
    });

    useEffect(() => {
        setTitle(initial?.title ?? "");
        setKey(initial?.key ?? "");
        setTerminal(!!initial?.terminal);
        setActive(initial?.active ?? true);
        setWip(initial?.wip_limit?.toString?.() ?? "");
        setSla(initial?.sla_days?.toString?.() ?? "");
        setHdr(initial?.color_header ?? "#f8fafc");
        setBdg(initial?.color_badge ?? "#e5e7eb");
        try { setColPatch(JSON.stringify(initial?.update_patch ?? {}, null, 2)); }
        catch { setColPatch("{}"); }
    }, [initial]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{initial?.id ? "Editar coluna" : "Nova coluna"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Título</Label>
                        <Input className="col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Chave</Label>
                        <Input className="col-span-2" value={key} onChange={(e) => setKey(slugify(e.target.value))} placeholder="inventario" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Terminal</Label>
                        <div className="col-span-2">
                            <Switch checked={terminal} onCheckedChange={setTerminal} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Ativa</Label>
                        <div className="col-span-2">
                            <Switch checked={active} onCheckedChange={setActive} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">WIP</Label>
                        <Input className="col-span-2" type="number" value={wip} onChange={(e) => setWip(e.target.value)} placeholder="opcional" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">SLA (dias)</Label>
                        <Input className="col-span-2" type="number" value={sla} onChange={(e) => setSla(e.target.value)} placeholder="opcional" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Cor header</Label>
                        <Input className="col-span-2 h-9 p-1" type="color" value={hdr} onChange={(e) => setHdr(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <Label className="col-span-1">Cor badge</Label>
                        <Input className="col-span-2 h-9 p-1" type="color" value={bdg} onChange={(e) => setBdg(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-start">
                        <Label className="col-span-1">Patch (JSON)</Label>
                        <textarea
                            className="col-span-2 border rounded-md p-2 font-mono text-xs h-28"
                            value={colPatch}
                            onChange={(e) => setColPatch(e.target.value)}
                            placeholder={`{"status":"Chamado","substatus":"Agendado"}`}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            if (!title.trim()) return toast.error("Informe o título");

                            // ✅ parse seguro do JSON
                            let parsedPatch: any = {};
                            try {
                                parsedPatch = colPatch.trim() ? JSON.parse(colPatch) : {};
                            } catch {
                                toast.error("Patch (JSON) inválido");
                                return;
                            }

                            onSubmit({
                                ...(initial?.id ? { id: initial.id } : {}),
                                title: title.trim(),
                                key: key || slugify(title),
                                terminal,
                                active,
                                wip_limit: wip ? Number(wip) : null,
                                sla_days: sla ? Number(sla) : null,
                                color_header: hdr,
                                color_badge: bdg,
                                update_patch: parsedPatch, // 👈 agora existe e está validado
                            });
                            onOpenChange(false);
                        }}
                    >
                        Salvar
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

// ---------------- transitions matrix ----------------
function TransitionsMatrix({ boardId, columns }: { boardId: string; columns: Column[] }) {
    const { data: transitions } = useTransitions(boardId);
    const toggle = useToggleTransition(boardId);
    const map = useMemo(() => {
        const m = new Map<string, boolean>();
        (transitions || []).forEach((t) => m.set(`${t.from_column_id}->${t.to_column_id}`, true));
        return m;
    }, [transitions]);
    const markAllRight = async (fromId: string) => {
        const fromIdx = columns.findIndex((c) => c.id === fromId);
        const toIds = columns.filter((_, i) => i > fromIdx).map((c) => c.id);
        for (const to of toIds) if (!map.get(`${fromId}->${to}`)) await toggle.mutateAsync({ from: fromId, to, enable: true });
        toast.success("Transições à direita liberadas");
    };
    const clearRow = async (fromId: string) => {
        const toIds = columns.map((c) => c.id);
        for (const to of toIds) if (map.get(`${fromId}->${to}`)) await toggle.mutateAsync({ from: fromId, to, enable: false });
        toast.success("Transições da linha removidas");
    };

    if (!columns.length) return <div className="text-sm text-muted-foreground">Adicione colunas.</div>;

    return (
        <div className="overflow-auto">
            <table className="min-w-[720px] w-full text-sm">
                <thead>
                    <tr>
                        <th className="text-left py-2 pr-4">De/Para</th>
                        {columns.map((c) => (
                            <th key={c.id} className="px-2 py-2 text-center whitespace-nowrap">
                                {c.title}
                            </th>
                        ))}
                        <th className="w-[200px]"></th>
                    </tr>
                </thead>
                <tbody>
                    {columns.map((from) => (
                        <tr key={from.id} className="border-t">
                            <td className="py-2 pr-4 font-medium whitespace-nowrap">{from.title}</td>
                            {columns.map((to) => {
                                const disabled = from.id === to.id;
                                const checked = !!map.get(`${from.id}->${to.id}`);
                                return (
                                    <td key={to.id} className="px-2 py-2 text-center">
                                        <Checkbox
                                            disabled={disabled}
                                            checked={disabled ? false : checked}
                                            onCheckedChange={(v) => toggle.mutate({ from: from.id, to: to.id, enable: Boolean(v) })}
                                        />
                                    </td>
                                );
                            })}
                            <td className="text-right py-2">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => markAllRight(from.id)}>
                                        Permitir à direita <MoveRight className="ml-1 h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => clearRow(from.id)}>
                                        Limpar
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ---------------- preview ----------------
function PreviewBoard({ columns }: { columns: Column[] }) {
    const mock = [
        { id: "m1", cliente: "ACME Ltda.", numero: "#1023", valor: 23800, kwp: 8.5 },
        { id: "m2", cliente: "João da Silva", numero: "#1024", valor: 41000, kwp: 12.3 },
    ];
    return (
        <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map((col) => (
                <div key={col.id} className="min-w-[320px] max-w-[360px]">
                    <div className="rounded-md px-3 py-2 sticky top-0" style={{ backgroundColor: col.color_header || "#f8fafc" }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{col.title}</span>
                            <Badge style={{ backgroundColor: col.color_badge || "#e5e7eb", color: "#111827" }}>{mock.length}</Badge>
                        </div>
                    </div>
                    <div className="pt-2 space-y-2">
                        {mock.map((m) => (
                            <Card
                                key={m.id}
                                className="border-l-4"
                                style={{ borderLeftColor: m.valor >= 40000 ? "#10b981" : m.valor >= 15000 ? "#f59e0b" : "#cbd5e1" }}
                            >
                                <CardHeader className="p-3 pb-0">
                                    <CardTitle className="text-xs font-medium leading-tight">{m.cliente}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1 text-[11px] text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span>Nº: {m.numero}</span>
                                        <span>kWp: {m.kwp}</span>
                                    </div>
                                    <div>Valor: R$ {m.valor.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ---------------- main ----------------
export default function AdminKanban() {
    const { data: boards } = useBoards();
    const upsertBoard = useUpsertBoard();
    const deleteBoard = useDeleteBoard();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Board | null>(null);
    const [selected, setSelected] = useState<Board | null>(null);

    return (
        <ManagerGate>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin · Kanban</h1>
                        <p className="text-sm text-muted-foreground">Gerencie boards, colunas e transições.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />Novo board
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Boards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!boards?.length && <div className="text-sm text-muted-foreground">Nenhum board ainda.</div>}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {boards?.map((b) => (
                                <div key={b.id} className={`rounded-md border p-3 ${selected?.id === b.id ? "ring-2 ring-primary" : ""}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium">
                                                {b.name} <span className="text-xs text-muted-foreground">({b.slug})</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Entidade: {b.entity} · {b.active ? "Ativo" : "Inativo"}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setDialogOpen(true); }}>
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={async () => {
                                                    await deleteBoard.mutateAsync(b.id);
                                                    toast.success("Board removido");
                                                    if (selected?.id === b.id) setSelected(null);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button variant={selected?.id === b.id ? "default" : "outline"} onClick={() => setSelected(b)}>
                                            Configurar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <BoardDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    initial={editing}
                    onSubmit={async (payload) => {
                        const saved = await upsertBoard.mutateAsync({ id: editing?.id, ...payload });
                        toast.success("Board salvo");
                        setSelected(saved);
                    }}
                />

                {selected && <BoardEditor board={selected} />}
            </div>
        </ManagerGate>
    );
}

// ---------------- editor ----------------
function BoardEditor({ board }: { board: Board }) {
    const { data: cols } = useColumns(board.id);
    const upsertCol = useUpsertColumn(board.id);
    const delCol = useDeleteColumn(board.id);
    const saveOrder = useSaveOrder(board.id);

    const [localCols, setLocalCols] = useState<Column[]>([]);
    useEffect(() => {
        setLocalCols(cols ?? []);
    }, [cols]);

    const [colDialogOpen, setColDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Column | null>(null);

    const onDragEnd = (r: DropResult) => {
        if (!r.destination) return;
        const arr = [...(localCols || [])];
        const [moved] = arr.splice(r.source.index, 1);
        arr.splice(r.destination.index, 0, moved);
        setLocalCols(arr);
    };
    const persistOrder = async () => {
        await saveOrder.mutateAsync(localCols);
        toast.success("Ordem salva");
    };

    return (
        <Tabs defaultValue="columns" className="w-full">
            <TabsList>
                <TabsTrigger value="columns">Colunas</TabsTrigger>
                <TabsTrigger value="transitions">Transições</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="columns">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle>Colunas – {board.name}</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={persistOrder}>
                                Salvar ordem
                            </Button>
                            <Button onClick={() => { setEditing(null); setColDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar coluna
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!localCols?.length && <div className="text-sm text-muted-foreground">Nenhuma coluna ainda.</div>}
                        {!!localCols?.length && (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="cols">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                            {localCols.map((c, i) => (
                                                <Draggable key={c.id} draggableId={c.id} index={i}>
                                                    {(prov) => (
                                                        <div
                                                            ref={prov.innerRef}
                                                            {...prov.draggableProps}
                                                            className="rounded-md border bg-card p-3 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span {...prov.dragHandleProps} className="cursor-grab text-muted-foreground">
                                                                    <GripVertical className="h-4 w-4" />
                                                                </span>
                                                                <div
                                                                    className="w-3 h-3 rounded-sm"
                                                                    style={{ backgroundColor: c.color_header || "#f8fafc", border: "1px solid #e5e7eb" }}
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        {c.title} <span className="text-xs text-muted-foreground">({c.key})</span>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        ord {i + 1} · {c.terminal ? "terminal" : "intermediária"} · {c.active ? "ativa" : "inativa"}
                                                                        {c.wip_limit ? ` · WIP ${c.wip_limit}` : ""}
                                                                        {c.sla_days ? ` · SLA ${c.sla_days}d` : ""}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setColDialogOpen(true); }}>
                                                                    <Edit3 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={async () => {
                                                                        await delCol.mutateAsync(c.id);
                                                                        toast.success("Coluna removida");
                                                                    }}
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

                <ColumnDialog
                    open={colDialogOpen}
                    onOpenChange={setColDialogOpen}
                    initial={editing}
                    onSubmit={async (payload) => {
                        const saved = await upsertCol.mutateAsync(payload);
                        // otimista simples: se era novo, joga no fim local
                        if (!editing) setLocalCols((prev) => [...prev, { ...saved, ord: (prev.reduce((m, c) => Math.max(m, c.ord), 0) || 0) + 1 }]);
                        toast.success("Coluna salva");
                    }}
                />
            </TabsContent>

            <TabsContent value="transitions">
                <Card>
                    <CardHeader>
                        <CardTitle>Transições – {board.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TransitionsMatrix boardId={board.id} columns={localCols} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="preview">
                <Card>
                    <CardHeader>
                        <CardTitle>Preview – {board.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PreviewBoard columns={localCols} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
