export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex-1 bg-border rounded-full overflow-hidden h-1.5">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
          {currentStep} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
