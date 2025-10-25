import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface KanbanCardBadge {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle?: string;
  badges?: KanbanCardBadge[];
  avatar?: {
    name: string;
    image?: string;
  };
  alerts?: string[];
  metadata?: Record<string, ReactNode>;
}

interface KanbanCardProps {
  data: KanbanCardData;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ data, onClick, isDragging }: KanbanCardProps) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header com título e avatar */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{data.title}</h4>
            {data.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{data.subtitle}</p>
            )}
          </div>
          {data.avatar && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {data.avatar.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Badges */}
        {data.badges && data.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.badges.map((badge, idx) => (
              <Badge
                key={idx}
                variant={badge.variant}
                className={cn("text-xs", badge.className)}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-medium">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Alertas */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="pt-2 border-t">
            {data.alerts.map((alert, idx) => (
              <p key={idx} className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ {alert}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
