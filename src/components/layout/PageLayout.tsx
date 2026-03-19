import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';

type PageLayoutProps = {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Use compact padding on mobile */
  compact?: boolean;
};

export default function PageLayout({
  breadcrumbs,
  title,
  subtitle,
  actions,
  children,
  compact = false,
}: PageLayoutProps) {
  const padding = compact
    ? 'p-4 md:p-6 lg:p-8 pt-20 md:pt-6 pb-20'
    : 'p-4 md:p-6 lg:p-8 pt-20 md:pt-6 pb-20';

  return (
    <main className={`min-h-screen bg-[var(--bg-root)] text-white ${padding}`}>
      <div className="max-w-[1400px] mx-auto">
        <header
          className="mb-6 md:mb-8 pb-6 border-b border-[var(--border-subtle)]"
          style={{ marginBottom: 'var(--page-header-gap, 1.5rem)' }}
        >
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-3">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {title}
              </h1>
              {subtitle != null && (
                <div className="text-sm text-[var(--text-tertiary)] mt-1">
                  {subtitle}
                </div>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </header>
        <div
          className="space-y-6 md:space-y-8"
          style={{ gap: 'var(--page-section-gap, 1.5rem)' }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
