export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-7">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5 font-mono text-[11px] text-[var(--muted-foreground)]">{breadcrumb}</div>}
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[var(--foreground)] sm:text-[26px] md:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 hidden max-w-2xl text-[14px] leading-[1.55] text-[var(--muted-foreground)] sm:block">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
