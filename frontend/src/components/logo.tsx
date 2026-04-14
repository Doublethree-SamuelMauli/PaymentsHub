export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const s = {
    small:   { shield: 22, text: "text-[15px]", gap: "gap-2" },
    default: { shield: 28, text: "text-lg",     gap: "gap-2.5" },
    large:   { shield: 40, text: "text-2xl",    gap: "gap-3" },
  }[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      <ShieldIcon size={s.shield} />
      <span className={`${s.text} font-bold tracking-tight`}>
        <span className="text-[#1a2744]">Payments</span>
        <span className="text-[#22863a]">Hub</span>
      </span>
    </div>
  );
}

export function ShieldIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sh_bl" x1="8" y1="4" x2="40" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb"/>
          <stop offset="1" stopColor="#0f2440"/>
        </linearGradient>
        <linearGradient id="sh_gr" x1="32" y1="4" x2="56" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80"/>
          <stop offset="1" stopColor="#15803d"/>
        </linearGradient>
        <linearGradient id="sh_hi" x1="8" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.25"/>
          <stop offset="1" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d="M32 4L8 16v16c0 16 24 28 24 28s24-12 24-28V16L32 4z" fill="url(#sh_bl)"/>
      <path d="M32 4v44s24-12 24-28V16L32 4z" fill="url(#sh_gr)"/>
      <path d="M32 4L8 16v16c0 8 8 16 16 22V4z" fill="url(#sh_hi)"/>
      <path d="M22 32l8 8 14-16" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
