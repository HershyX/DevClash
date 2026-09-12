import { forwardRef, HTMLAttributes } from 'react';
import { cn, getInitials } from '../../utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

const statusColors = {
  online: 'bg-practice-500',
  offline: 'bg-surface-400',
  busy: 'bg-duel-500',
  away: 'bg-yellow-500',
};

const statusPositions = {
  'bottom-right': 'bottom-0 right-0',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-left': 'top-0 left-0',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', status, statusPosition = 'bottom-right', ...props }, ref) => {
    const initials = name ? getInitials(name) : '?';
    const hasImage = src && src.length > 0;
    const bgColor = name 
      ? `bg-[hsl(${name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360},70%,50%)]`
      : 'bg-surface-400';

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden font-medium',
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          className
        )}
        {...props}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center', bgColor)}>
            {initials}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute border-2 border-white dark:border-surface-900 rounded-full',
              statusSizeClasses[size],
              statusColors[status],
              statusPositions[statusPosition]
            )}
            aria-label={status}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps['size'];
  overlap?: boolean;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max, size = 'md', overlap = true, ...props }, ref) => {
    const childrenArray = Array.isArray(children) ? children : [children];
    const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = max && childrenArray.length > max ? childrenArray.length - max : 0;

    return (
      <div
        ref={ref}
        className={cn('flex items-center', overlap && '-space-x-2', className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className={cn('relative z-10', index > 0 && 'ml-0')}>
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'relative z-0 flex items-center justify-center font-medium bg-surface-100 text-surface-600 border-2 border-white dark:bg-surface-800 dark:text-surface-400 dark:border-surface-900',
              sizeClasses[size],
              'rounded-full'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';