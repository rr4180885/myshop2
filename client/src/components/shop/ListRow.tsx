import { cn } from "@/lib/utils";

interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function ListRow({ title, subtitle, right, className, ...props }: ListRowProps) {
  return (
    <div className={cn("list-row", className)} {...props}>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 ml-4 text-right">{right}</div>}
    </div>
  );
}
