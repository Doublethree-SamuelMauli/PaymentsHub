import { Loader2 } from "lucide-react";

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function Spinner({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const cls = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return <Loader2 className={`${cls} animate-spin`} />;
}
