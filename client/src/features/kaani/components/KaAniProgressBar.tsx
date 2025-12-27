interface KaAniProgressBarProps {
  progress: {
    requiredTotal: number;
    requiredFilled: number;
    percent: number;
    missingRequired: string[];
  };
}

export function KaAniProgressBar({ progress }: KaAniProgressBarProps) {
  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">Progress</span>
            <span className="text-gray-600">
              {progress.requiredFilled}/{progress.requiredTotal} ({progress.percent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

