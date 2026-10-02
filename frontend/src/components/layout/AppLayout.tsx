import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { cn } from '../../utils';

export function AppLayout({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-screen', className)} style={{ background:'#07080a' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <TopNavigation />
        <main
          className="flex-1 p-5 lg:p-7 xl:p-8 overflow-auto"
          style={{ background:'#07080a' }}
          role="main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PublicLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#07080a' }}>
      {/* Public top nav */}
      <header
        className="sticky top-0 z-20"
        style={{ background:'rgba(7,8,10,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}
      >
        <nav className="max-w-7xl mx-auto px-5 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white"
              style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 16px rgba(99,102,241,0.45)' }}
            >
              DC
            </div>
            <span className="font-bold text-base text-white tracking-tight">DevClash</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium text-surface-400 hover:text-white transition-colors"
            >
              Sign in
            </a>
            <a
              href="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-px"
              style={{
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow:'0 0 16px rgba(99,102,241,0.35)',
              }}
            >
              Get Started
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1" role="main">
        {children || <Outlet />}
      </main>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'1.5rem 0' }}>
        <div className="max-w-7xl mx-auto px-5 text-center text-xs text-surface-600">
          © 2025 DevClash · Code. Compete. Improve.
        </div>
      </footer>
    </div>
  );
}
