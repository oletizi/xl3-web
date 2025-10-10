import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/utils/syncDetection';

interface SlotCardProps {
  slotIndex: number;
  slotName: string;
  isActive: boolean;
  syncStatus: SyncStatus;
  onClick: () => void;
}

export function SlotCard({
  slotIndex,
  slotName,
  isActive,
  syncStatus,
  onClick
}: SlotCardProps) {
  const syncIcon = {
    synced: <Check className="w-4 h-4 text-green-500" />,
    modified: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    syncing: <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />,
    unknown: <HelpCircle className="w-4 h-4 text-gray-400" />
  }[syncStatus];

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={isActive}
      aria-label={`Slot ${slotIndex}: ${slotName}${isActive ? ' (active)' : ''}`}
      className={cn(
        'flex flex-col items-center justify-center p-3 cursor-pointer',
        'transition-all hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive && 'ring-2 ring-primary shadow-glow-primary'
      )}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">
          {slotIndex}
        </Badge>
        {isActive && syncIcon}
      </div>
      <span className="text-sm font-medium text-center line-clamp-1">
        {slotName}
      </span>
    </Card>
  );
}
