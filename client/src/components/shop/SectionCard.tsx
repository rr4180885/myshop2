import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  noPadding?: boolean;
  "data-testid"?: string;
}

export default function SectionCard({
  title,
  icon: Icon,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  noPadding,
  "data-testid": testId,
}: SectionCardProps) {
  return (
    <div className={cn("surface-card overflow-hidden", className)} data-testid={testId}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5 py-4",
          headerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className={cn(!noPadding && "p-5", contentClassName)}>{children}</div>
    </div>
  );
}
