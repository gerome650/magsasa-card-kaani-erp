import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * ErrorState Component
 * 
 * Displays error messages with optional retry functionality.
 * Used when queries fail to provide users with clear feedback and recovery options.
 * 
 * @param title - Error title (default: "Failed to load data")
 * @param message - Error description (default: "Something went wrong...")
 * @param onRetry - Callback function when "Try Again" is clicked (typically refetch())
 * @param showRetry - Whether to show the retry button (default: true)
 */
export function ErrorState({
  title = "Failed to load data",
  message = "Something went wrong while loading the data. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
        </div>
        
        <h3 className="mb-2 text-lg font-semibold text-destructive">
          {title}
        </h3>
        
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {message}
        </p>
        
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-destructive/50 hover:bg-destructive/10"
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
