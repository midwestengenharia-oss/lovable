import { ReactNode } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  color?: string;
  count?: number;
  children: ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Header da coluna */}
      <div className="mb-3 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors",
              snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/20"
            )}
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

interface DraggableCardWrapperProps {
  id: string;
  index: number;
  children: ReactNode;
}

export function DraggableCardWrapper({ id, index, children }: DraggableCardWrapperProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
}
