import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ value, className, showPercentage = false }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div 
          className="bg-neon-green h-3 rounded-full progress-glow transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
