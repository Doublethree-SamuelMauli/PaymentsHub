export function PageHeader({ title, description, actions, breadcrumb }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5 text-xs text-[var(--muted-foreground)]">{breadcrumb}</div>}
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl md:text-[26px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 hidden max-w-2xl text-sm text-[var(--muted-foreground)] sm:block">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
