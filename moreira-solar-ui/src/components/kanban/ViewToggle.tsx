import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ViewToggleProps {
  view: "kanban" | "lista";
  onViewChange: (view: "kanban" | "lista") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v as "kanban" | "lista")}>
      <ToggleGroupItem value="kanban" aria-label="Visão Kanban">
        <LayoutGrid className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Kanban</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="lista" aria-label="Visão Lista">
        <List className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Lista</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
