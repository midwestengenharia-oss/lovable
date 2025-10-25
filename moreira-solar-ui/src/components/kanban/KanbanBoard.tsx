import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn, DraggableCardWrapper } from "./KanbanColumn";
import { KanbanCard, KanbanCardData } from "./KanbanCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface KanbanColumnData {
  id: string;
  title: string;
  color?: string;
  items: KanbanCardData[];
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onDragEnd: (result: DropResult) => void;
  onCardClick?: (item: KanbanCardData) => void;
  loading?: boolean;
}

export function KanbanBoard({ columns, onDragEnd, onCardClick, loading }: KanbanBoardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4 p-1">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={column.items.length}
            >
              {column.items.map((item, index) => (
                <DraggableCardWrapper key={item.id} id={item.id} index={index}>
                  <KanbanCard
                    data={item}
                    onClick={() => onCardClick?.(item)}
                  />
                </DraggableCardWrapper>
              ))}
            </KanbanColumn>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DragDropContext>
  );
}
