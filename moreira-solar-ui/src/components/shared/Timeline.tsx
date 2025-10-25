import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type?: "info" | "success" | "warning" | "error";
  user?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const getTypeColor = (type?: TimelineEvent["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum evento registrado
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          {/* Timeline marker */}
          <div className="flex flex-col items-center">
            <div className={cn("w-2 h-2 rounded-full", getTypeColor(event.type))} />
            {index < events.length - 1 && (
              <div className="w-px h-full bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(event.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
            {event.user && (
              <p className="text-xs text-muted-foreground mt-1">Por: {event.user}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
