import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * Reusable empty state component with illustration and CTAs
 * 
 * @example
 * <EmptyState
 *   icon={Tractor}
 *   title="No farms registered yet"
 *   description="Get started by registering your first farm..."
 *   actionLabel="Add Farm"
 *   onAction={() => navigate('/farms/new')}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {/* Icon/Illustration */}
        <div className="mb-6 rounded-full bg-muted p-6">
          <Icon className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} size="lg">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline" size="lg">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact empty state for smaller sections (e.g., within tables)
 */
export function EmptyStateCompact({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: Omit<EmptyStateProps, 'secondaryActionLabel' | 'onSecondaryAction'>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icon */}
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h4 className="text-base font-semibold mb-1">{title}</h4>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>

      {/* Action */}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
