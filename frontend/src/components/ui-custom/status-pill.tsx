import { cn } from "@/lib/utils";
import { statusLabel, statusTone, toneClasses } from "@/lib/format";

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold tracking-wide uppercase border",
      toneClasses(statusTone(status)),
      className
    )}>
      {statusLabel(status)}
    </span>
  );
}
