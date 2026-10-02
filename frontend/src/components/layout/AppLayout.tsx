import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { cn } from '../../utils';

interface AppLayoutProps {
  className?: string;
}

export function AppLayout({ className }: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen bg-surface-50 dark:bg-surface-950', className)}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <TopNavigation />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


export function PublicLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <header className="border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between" aria-label="Public navigation">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">DC</span>
            </div>
            <span className="font-semibold text-xl text-surface-900 dark:text-white">DevClash</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
              Login
            </a>
            <a href="/login" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
              Get Started
            </a>
          </div>
        </nav>
      </header>
      <main className="flex-1" role="main">
        {children || <Outlet />}
      </main>
      <footer className="border-t border-surface-200 dark:border-surface-700 py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center text-sm text-surface-500 dark:text-surface-400">
          © 2024 DevClash. Code. Compete. Improve.
        </div>
      </footer>
    </div>
  );
}