export function Logo({ size = "md", iconOnly = false }: { size?: "sm" | "md" | "lg"; iconOnly?: boolean }) {
  const sizes = {
    sm: { icon: 22, text: "text-[14px]", gap: "gap-2" },
    md: { icon: 28, text: "text-[16px]", gap: "gap-2" },
    lg: { icon: 44, text: "text-[24px]", gap: "gap-2.5" },
  };
  const s = sizes[size];
  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <ShieldMark size={s.icon} />
      {!iconOnly && (
        <span className={`${s.text} font-semibold tracking-tight text-foreground`}>
          Payments<span className="text-[var(--brand-accent)]">Hub</span>
        </span>
      )}
    </div>
  );
}

export function ShieldMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="bl_gr" x1="8" y1="4" x2="36" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e4ea8" />
          <stop offset="1" stopColor="#0a1d44" />
        </linearGradient>
        <linearGradient id="gr_gr" x1="28" y1="4" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#143573" />
        </linearGradient>
        <linearGradient id="hl_gr" x1="8" y1="4" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M32 4L8 16v16c0 16 24 28 24 28s24-12 24-28V16L32 4z" fill="url(#bl_gr)" />
      <path d="M32 4v44s24-12 24-28V16L32 4z" fill="url(#gr_gr)" />
      <path d="M32 4L8 16v16c0 8 8 16 16 22V4z" fill="url(#hl_gr)" />
      <path d="M22 32l8 8 14-16" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
