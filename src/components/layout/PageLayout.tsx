import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { motion } from 'framer-motion';

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
    ? 'px-4 md:px-8 pt-8 md:pt-12 pb-32'
    : 'px-6 md:px-12 pt-8 md:pt-16 pb-32';

  return (
    <main className={`min-h-screen bg-[var(--bg-root)] text-white ${padding}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1400px] mx-auto"
      >
        <header
          className="mb-8 md:mb-12 pb-8 border-b border-[var(--border-subtle)] relative"
          style={{ marginBottom: 'var(--page-header-gap, 2rem)' }}
        >
          {/* Ambient Header Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-6">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 relative z-10">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tightest text-white uppercase italic">
                {title}
              </h1>
              {subtitle != null && (
                <div className="text-sm md:text-base text-[var(--text-secondary)] mt-2 font-medium max-w-2xl opacity-80 uppercase tracking-widest">
                  {subtitle}
                </div>
              )}
            </div>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
          </div>
        </header>

        <div
          className="space-y-8 md:space-y-12"
          style={{ gap: 'var(--page-section-gap, 2rem)' }}
        >
          {children}
        </div>
      </motion.div>
    </main>
  );
}
