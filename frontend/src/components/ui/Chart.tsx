import { motion } from 'framer-motion';
import { cn } from '../../utils';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'progress';
  height?: number;
  className?: string;
  showLabels?: boolean;
  showValues?: boolean;
}

export function Chart({ 
  data, 
  type = 'bar', 
  height = 200, 
  className,
  showLabels = true,
  showValues = true 
}: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'progress') {
    return <ProgressChart data={data} className={className} showLabels={showLabels} showValues={showValues} />;
  }

  if (type === 'line') {
    return <LineChart data={data} height={height} className={className} showLabels={showLabels} showValues={showValues} />;
  }

  return <BarChart data={data} height={height} maxValue={maxValue} className={className} showLabels={showLabels} showValues={showValues} />;
}

function BarChart({ 
  data, 
  height, 
  maxValue, 
  className, 
  showLabels, 
  showValues 
}: { 
  data: ChartDataPoint[]; 
  height: number; 
  maxValue: number; 
  className?: string;
  showLabels: boolean;
  showValues: boolean;
}) {
  const barWidth = 100 / data.length;
  const gap = 2;

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="flex items-end h-full gap-1">
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * 100;
          const color = point.color || 'bg-brand-500';
          
          return (
            <motion.div
              key={point.label}
              className="flex-1 flex flex-col items-center"
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {showValues && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-1"
                >
                  {point.value}
                </motion.span>
              )}
              <div
                className={cn('w-full rounded-t-sm', color)}
                style={{ height: '100%' }}
              />
              {showLabels && (
                <span className="text-xs text-surface-500 dark:text-surface-400 mt-2 truncate w-full text-center">
                  {point.label}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ 
  data, 
  height, 
  className, 
  showLabels, 
  showValues 
}: { 
  data: ChartDataPoint[]; 
  height: number; 
  className?: string;
  showLabels: boolean;
  showValues: boolean;
}) {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value / maxValue) * 100);
    return { x, y, value: point.value, label: point.label };
  });

  const pathD = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `L ${point.x} ${point.y}`;
  }).join(' ');

  return (
    <div className={cn('w-full relative', className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            className="fill-brand-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
          />
        ))}
      </svg>
      
      {showLabels && (
        <div className="flex justify-between mt-2">
          {data.map((point, index) => (
            <span key={index} className="text-xs text-surface-500 dark:text-surface-400">
              {point.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressChart({ 
  data, 
  className, 
  showLabels, 
  showValues 
}: { 
  data: ChartDataPoint[]; 
  className?: string;
  showLabels: boolean;
  showValues: boolean;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {data.map((point, index) => (
        <motion.div
          key={point.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            {showLabels && (
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {point.label}
              </span>
            )}
            {showValues && (
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {point.value}
              </span>
            )}
          </div>
          <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', point.color || 'bg-brand-500')}
              initial={{ width: 0 }}
              animate={{ width: `${point.value}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}