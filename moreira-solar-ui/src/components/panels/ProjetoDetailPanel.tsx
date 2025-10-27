import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ============================= Types ============================= */

type Projeto = any;

type StageField = {
  id: string;
  board_id: string;
  column_id: string;
  ord: number;
  key: string;
  label: string;
  type:
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "boolean"
  | "file";
  required: boolean;
  options: any[];
  helper?: string | null;
  active: boolean;
};

type StageValue = {
  project_id: string;
  field_id: string;
  value: any;
  updated_by?: string | null;
  updated_at?: string;
};

type Column = { id: string; title: string; key: string };

/* ============================= Helpers ============================= */

const BUCKET = "kanban_uploads";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeOptions = (options: any): { label: string; value: string }[] => {
  if (!Array.isArray(options)) return [];
  return options.map((o: any) =>
    typeof o === "string" ? { label: o, value: slugify(o) } : { label: String(o.label ?? o.value), value: String(o.value ?? o.label) }
  );
};

async function handleFileUpload(field: StageField, file: File, projetoId: string) {
  const path = `${projetoId}/${field.key}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    path,
    url: pub?.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

async function handleFileRemove(current: any) {
  if (!current?.path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([current.path]);
  if (error) throw error;
}

/* pretty print para valores do histórico */
function prettyValue(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") {
    // metadado de arquivo
    if (v.url && v.name) return v.name;
    return JSON.stringify(v);
  }
  return String(v);
}

/* ============================= Queries ============================= */

function useStageFields(columnId?: string) {
  return useQuery({
    enabled: !!columnId,
    queryKey: ["stage", "fields", columnId],
    queryFn: async (): Promise<StageField[]> => {
      const { data, error } = await supabase
        .from("stage_field")
        .select("*")
        .eq("column_id", columnId!)
        .eq("active", true)
        .order("ord");
      if (error) throw error;
      return data as any;
    },
  });
}

function useStageValues(projectId?: string, fieldIds?: string[]) {
  return useQuery({
    enabled: !!projectId && !!fieldIds?.length,
    queryKey: ["stage", "values", projectId, fieldIds?.join(",")],
    queryFn: async (): Promise<StageValue[]> => {
      const { data, error } = await supabase
        .from("stage_value")
        .select("*")
        .eq("project_id", projectId!)
        .in("field_id", fieldIds!);
      if (error) throw error;
      return data as any;
    },
  });
}

function useTransitions(fromColumnId?: string) {
  return useQuery({
    enabled: !!fromColumnId,
    queryKey: ["kanban", "transitions-from", fromColumnId],
    queryFn: async (): Promise<Column[]> => {
      const { data, error } = await supabase
        .from("kanban_transition")
        .select("to:to_column_id ( id, title, key )")
        .eq("from_column_id", fromColumnId!);
      if (error) throw error;
      return (data || []).map((t: any) => t.to) as Column[];
    },
  });
}

function useHistory(projectId?: string) {
  return useQuery({
    enabled: !!projectId,
    queryKey: ["projeto", "historico", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projeto_event")
        .select("*, from:from_column_id(title), to:to_column_id(title)")
        .eq("projeto_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/* ============================= Component ============================= */

export function ProjetoDetailPanel({
  projeto,
  open,
  onClose,
  onUpdate,
  onConcluir,
}: {
  projeto: Projeto;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onConcluir: (p: Projeto) => void;
}) {
  const qc = useQueryClient();
  const columnId = projeto?.kanban_column_id as string | undefined;

  /* campos e valores da fase */
  const { data: fields = [], isLoading: loadingFields } = useStageFields(columnId);
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields]);
  const { data: values = [] } = useStageValues(projeto?.id, fieldIds);

  const valueByField = useMemo(() => {
    const m = new Map<string, any>();
    values.forEach((v) => m.set(v.field_id, v.value));
    return m;
  }, [values]);

  const [local, setLocal] = useState<Record<string, any>>({});
  useEffect(() => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => (initial[f.id] = valueByField.get(f.id) ?? null));
    setLocal(initial);
  }, [fields, valueByField]);

  const setValue = (field: StageField, v: any) =>
    setLocal((prev) => ({ ...prev, [field.id]: v }));

  /* transições */
  const { data: toColumns = [] } = useTransitions(columnId);

  /* salvar */
  const saveValues = useMutation({
    mutationFn: async () => {
      const rows: StageValue[] = Object.keys(local).map((fid) => ({
        project_id: projeto.id,
        field_id: fid,
        value: local[fid],
      }));
      if (!rows.length) return;
      const { error } = await supabase.from("stage_value").upsert(rows);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Dados salvos");
      await qc.invalidateQueries({ queryKey: ["stage", "values", projeto?.id] });
      await qc.invalidateQueries({ queryKey: ["projeto", "historico", projeto?.id] });
    },
  });

  /* mover */
  const move = useMutation({
    mutationFn: async (toCol: string) => {
      const { error } = await supabase.rpc("fn_move_projeto", {
        p_projeto_id: projeto.id,
        p_to_column_id: toCol,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Movido com sucesso");
      await qc.invalidateQueries();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Não foi possível mover"),
  });

  /* histórico */
  const { data: historico = [] } = useHistory(projeto?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* max height + overflow controlado */}
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden"
        aria-describedby="projeto-detail-desc"
      >
        <div className="h-[90vh] flex flex-col">
          {/* Cabeçalho sticky */}
          <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 bg-background z-10">
            <DialogTitle>
              {projeto?.cliente_nome || projeto?.nome}{" "}
              <span className="text-muted-foreground text-sm">({projeto?.numero})</span>
            </DialogTitle>
            <p id="projeto-detail-desc" className="sr-only">
              Painel de detalhes do projeto
            </p>
          </DialogHeader>

          {/* Corpo rolável */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="fase" className="h-full">
              <TabsList className="sticky top-0 bg-background z-10">
                <TabsTrigger value="fase">Fase atual</TabsTrigger>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              {/* FASE ATUAL */}
              <TabsContent value="fase" className="mt-4 grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8">
                  {loadingFields && (
                    <p className="text-sm text-muted-foreground">Carregando campos…</p>
                  )}
                  {!loadingFields && !fields.length && (
                    <p className="text-sm text-muted-foreground">
                      Sem campos configurados para esta fase.
                    </p>
                  )}

                  <div className="space-y-4">
                    {fields.map((f) => (
                      <div key={f.id} className="grid grid-cols-4 gap-3 items-start">
                        <Label className="col-span-1">
                          {f.label} {f.required && <span className="text-destructive">*</span>}
                          {f.helper && (
                            <div className="text-xs text-muted-foreground">{f.helper}</div>
                          )}
                        </Label>

                        <div className="col-span-3">
                          {/* TEXT */}
                          {f.type === "text" && (
                            <Input
                              value={local[f.id] ?? ""}
                              onChange={(e) => setValue(f, e.target.value)}
                            />
                          )}

                          {/* TEXTAREA */}
                          {f.type === "textarea" && (
                            <Textarea
                              value={local[f.id] ?? ""}
                              onChange={(e) => setValue(f, e.target.value)}
                            />
                          )}

                          {/* NUMBER */}
                          {f.type === "number" && (
                            <Input
                              type="number"
                              value={local[f.id] ?? ""}
                              onChange={(e) =>
                                setValue(
                                  f,
                                  e.target.value === "" ? null : Number(e.target.value)
                                )
                              }
                            />
                          )}

                          {/* DATE */}
                          {f.type === "date" && (
                            <Input
                              type="date"
                              value={local[f.id]?.slice?.(0, 10) ?? ""}
                              onChange={(e) => setValue(f, e.target.value || null)}
                            />
                          )}

                          {/* BOOLEAN */}
                          {f.type === "boolean" && (
                            <Select
                              value={String(Boolean(local[f.id]))}
                              onValueChange={(v) => setValue(f, v === "true")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Sim</SelectItem>
                                <SelectItem value="false">Não</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {/* SELECT */}
                          {f.type === "select" && (
                            <Select
                              value={local[f.id] ?? ""}
                              onValueChange={(v) => setValue(f, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {normalizeOptions(f.options).map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* RADIO */}
                          {f.type === "radio" && (
                            <RadioGroup
                              value={String(local[f.id] ?? "")}
                              onValueChange={(v) => setValue(f, v)}
                              className="grid grid-cols-2 gap-2"
                            >
                              {normalizeOptions(f.options).map((o) => (
                                <div key={o.value} className="flex items-center space-x-2">
                                  <RadioGroupItem id={`${f.key}-${o.value}`} value={o.value} />
                                  <Label htmlFor={`${f.key}-${o.value}`}>{o.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}

                          {/* FILE */}
                          {f.type === "file" && (
                            <div className="space-y-2">
                              <Input
                                type="file"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const meta = await handleFileUpload(f, file, projeto.id);
                                    setValue(f, meta);
                                    toast.success("Arquivo enviado");
                                  } catch (err: any) {
                                    console.error(err);
                                    toast.error("Falha no upload");
                                  } finally {
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />

                              {local[f.id]?.url && (
                                <div className="flex items-center gap-3">
                                  <a
                                    href={local[f.id].url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-primary underline"
                                  >
                                    {local[f.id].name}{" "}
                                    {local[f.id].size
                                      ? `(${Math.round(local[f.id].size / 1024)} KB)`
                                      : ""}
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      try {
                                        await handleFileRemove(local[f.id]);
                                        setValue(f, null);
                                        toast.success(
                                          "Arquivo removido (clique em Salvar para confirmar)"
                                        );
                                      } catch (err: any) {
                                        toast.error("Erro ao remover arquivo");
                                      }
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => saveValues.mutate()}>Salvar</Button>
                    <Button variant="outline" onClick={onClose}>
                      Fechar
                    </Button>
                  </div>
                </div>

                {/* Lado direito */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Mover card para fase</h4>
                      <Badge variant="secondary">{projeto?.status}</Badge>
                    </div>
                    <Separator className="my-3" />
                    {!toColumns.length && (
                      <p className="text-sm text-muted-foreground">
                        Sem transições configuradas a partir desta fase.
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {toColumns.map((c) => (
                        <Button
                          key={c.id}
                          variant="secondary"
                          onClick={() => move.mutate(c.id)}
                        >
                          {c.title}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Resumo do projeto</h4>
                    <Separator />
                    <div className="text-sm">
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>{" "}
                        {projeto?.cliente_nome}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nº:</span>{" "}
                        {projeto?.numero}
                      </div>
                      <div>
                        <span className="text-muted-foreground">kWp:</span> {projeto?.kwp}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>{" "}
                        {new Date(projeto?.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onUpdate(projeto.id, { prioridade: "Alta" })}
                      >
                        Prioridade Alta
                      </Button>
                      <Button variant="outline" onClick={() => onConcluir(projeto)}>
                        Concluir
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* DETALHES */}
              <TabsContent value="detalhes" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      defaultValue={projeto?.observacoes || ""}
                      onBlur={(e) =>
                        onUpdate(projeto.id, { observacoes: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Próximos passos</Label>
                    <Textarea
                      defaultValue={projeto?.proximos_passos || ""}
                      onBlur={(e) =>
                        onUpdate(projeto.id, { proximos_passos: e.target.value })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* HISTÓRICO */}
              <TabsContent value="historico" className="mt-4">
                {!historico.length && (
                  <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>
                )}

                {/* scroll só no histórico */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {historico.map((ev: any) => {
                    const changed = ev?.changed ?? null; // pode vir null
                    const safeEntries =
                      changed && typeof changed === "object"
                        ? Object.entries(changed as Record<string, any>)
                        : [];

                    return (
                      <div key={ev.id} className="border rounded-md p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {ev.type === "move" && (
                              <>
                                Moveu{" "}
                                {ev.from?.title ? `de ${ev.from.title} ` : ""}para{" "}
                                {ev.to?.title}
                              </>
                            )}
                            {ev.type === "form" && (ev.message || "Atualizou campos")}
                            {ev.type === "update" && "Atualização"}
                            {ev.type === "create" && "Criação"}
                            {ev.type === "file" && "Arquivo"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ev.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>

                        {/* mensagem simples */}
                        {ev.type === "file" && ev.meta?.name && (
                          <div className="mt-1">
                            Arquivo:{" "}
                            {ev.meta?.url ? (
                              <a
                                href={ev.meta.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {ev.meta.name}
                              </a>
                            ) : (
                              ev.meta.name
                            )}
                          </div>
                        )}

                        {/* diff bonitinho */}
                        {!!safeEntries.length && (
                          <div className="mt-2 space-y-1">
                            {safeEntries.map(([k, v]) => {
                              const oldVal = v?.old ?? null;
                              const newVal = v?.new ?? null;
                              return (
                                <div key={k} className="text-xs">
                                  <span className="text-muted-foreground">{k}:</span>{" "}
                                  <span className="line-through opacity-60 mr-1">
                                    {prettyValue(oldVal)}
                                  </span>
                                  <span className="mx-1">→</span>
                                  <span className="font-medium">{prettyValue(newVal)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
