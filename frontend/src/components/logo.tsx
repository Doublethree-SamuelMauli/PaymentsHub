import { Shield } from "lucide-react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizes = {
    small: { icon: "h-4 w-4", text: "text-sm" },
    default: { icon: "h-5 w-5", text: "text-base" },
    large: { icon: "h-7 w-7", text: "text-2xl" },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      <div className="bg-zinc-900 p-1.5 rounded-md">
        <Shield className={`${s.icon} text-emerald-400`} />
      </div>
      <span className={`${s.text} font-bold text-zinc-900 tracking-tight`}>
        Payments<span className="text-emerald-600">Hub</span>
      </span>
    </div>
  );
}
