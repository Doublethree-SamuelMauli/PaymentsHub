/* eslint-disable @next/next/no-img-element */
export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const h = { small: 28, default: 36, large: 52 }[size];
  return (
    <img src="/logo.svg" alt="PaymentsHub" height={h} style={{ height: h, width: "auto" }} />
  );
}

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="12 0 32 52" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4C24 4 28 2 28 2C28 2 32 4 32 4L40 8V28C40 38 28 48 28 48C28 48 16 38 16 28V8L24 4Z" fill="#1a365d"/>
      <path d="M28 2L28 48C28 48 40 38 40 28V8L32 4L28 2Z" fill="#22863a"/>
      <path d="M20 18L28 30L40 14V8L32 4L28 2L24 4L16 8V16L20 18Z" fill="#2ea043" opacity="0.7"/>
      <path d="M21 24L26 30L36 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
