import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="glow-orb left-[-10%] top-[20%] h-[420px] w-[420px] bg-[#143573] opacity-30" />
      <div className="glow-orb right-[-15%] bottom-[10%] h-[460px] w-[460px] bg-[#1e4ea8] opacity-30" />
      <div className="noise" />
      <div className="relative">{children}</div>
    </div>
  );
}
