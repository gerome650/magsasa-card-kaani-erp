interface KaAniProgressBarProps {
  progress: {
    requiredTotal: number;
    requiredFilled: number;
    percent: number;
    missingRequired: string[];
  };
}

export function KaAniProgressBar({ progress }: KaAniProgressBarProps) {
  // Guard: Never allow denominator = 0, ensure meaningful progress display
  const displayTotal = progress.requiredTotal > 0 ? progress.requiredTotal : 1;
  const displayFilled = progress.requiredFilled;
  const displayPercent = Math.max(0, Math.min(100, progress.percent));

  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">Progress</span>
            <span className="text-gray-600">
              {displayFilled}/{displayTotal} ({displayPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

