import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  const syncIconConfig = {
    synced: {
      icon: <Check className="w-4 h-4 text-green-500" />,
      tooltip: 'Editor matches device slot'
    },
    modified: {
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      tooltip: 'Editor differs from device slot'
    },
    syncing: {
      icon: <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />,
      tooltip: 'Checking sync status...'
    },
    unknown: {
      icon: <HelpCircle className="w-4 h-4 text-gray-400" />,
      tooltip: 'Sync status unknown'
    }
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
        {isActive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {syncIconConfig.icon}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{syncIconConfig.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-sm font-medium text-center line-clamp-1">
        {slotName}
      </span>
    </Card>
  );
}
