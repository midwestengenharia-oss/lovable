// types/board.ts
export type ColumnConfig = {
    id: string;             // ex: "triagem", "agendado", "em_atendimento"
    title: string;          // rótulo da coluna
    wipLimit?: number;      // limite WIP opcional
    color?: string;         // opcional (se quiser colorir header)
    mapsTo?: {              // como isso mapeia para o seu domínio
        status?: Chamado["status"];
        substatus?: string;   // se você usar substatus como string livre
    };
};

export type TransitionMap = Record<string /*from columnId*/, string[] /*to columnId*/>;

export type Preset = {
    id: string;             // ex: "hoje", "pendente_cliente"
    label: string;          // ex: "Hoje & Atrasados"
    // Função que recebe o chamado (completo) e diz se entra no preset
    predicate: (c: Chamado) => boolean;
};

export type SlaRule = {
    prioridade: Chamado["prioridade"];
    minutes: number;        // ex: 1440
};

export type BoardConfig = {
    id: string;
    title: string;
    columns: ColumnConfig[];
    transitions?: TransitionMap;
    sla?: SlaRule[];        // se não vier, uso default
    presets?: Preset[];     // filtros prontos
};
