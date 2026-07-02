import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
