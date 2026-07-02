import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "accent";
}

const variantStyles = {
  default: "bg-primary/10 text-primary ring-primary/15",
  success: "bg-success/10 text-success ring-success/15",
  warning: "bg-warning/10 text-warning ring-warning/15",
  accent: "bg-primary/10 text-primary ring-primary/15",
};

export default function StatCard({ label, value, hint, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <div className="surface-card p-5 group hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
