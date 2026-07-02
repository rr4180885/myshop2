import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export default function PageShell({ children, className, narrow }: PageShellProps) {
  return (
    <div className={cn("page-shell", narrow && "max-w-3xl", className)}>
      {children}
    </div>
  );
}
