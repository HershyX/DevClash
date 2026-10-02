import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { cn } from '../../utils';

interface TabsContextType {
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant: 'line' | 'pills' | 'enclosed';
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps {
  children: ReactNode;
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'line' | 'pills' | 'enclosed';
  className?: string;
}

export function Tabs({ children, defaultValue, value, onChange, variant = 'line', className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue);
  const controlled = value !== undefined;

  const handleTabChange = useCallback((tab: string) => {
    if (!controlled) {
      setActiveTab(tab);
    }
    onChange?.(tab);
  }, [controlled, onChange]);

  return (
    <TabsContext.Provider value={{ activeTab: controlled ? value! : activeTab, onTabChange: handleTabChange, variant }}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function TabsList({ children, className, ariaLabel }: TabsListProps) {
  const { variant } = useContext(TabsContext)!;
  
  const variants = {
    line: 'border-b border-surface-200 dark:border-surface-700',
    pills: 'bg-surface-100 dark:bg-surface-800 p-1 rounded-lg',
    enclosed: 'bg-surface-100 dark:bg-surface-800 rounded-lg',
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1', variants[variant], className)}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  badge?: string | number;
}

export function TabTrigger({ value, children, disabled = false, className, leftIcon, rightIcon, badge }: TabTriggerProps) {
  const { activeTab, onTabChange, variant } = useContext(TabsContext)!;
  const isActive = activeTab === value;

  const variants = {
    line: isActive
      ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
      : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200',
    pills: isActive
      ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
      : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200',
    enclosed: isActive
      ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
      : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200',
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      onClick={() => !disabled && onTabChange(value)}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
      {badge !== undefined && (
        <span className={cn(
          'ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full',
          isActive 
            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
            : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)!;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  );
}

export { TabsList as TabList, TabPanel as TabContent };