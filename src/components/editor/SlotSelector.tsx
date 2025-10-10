import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { SlotCard } from './SlotCard';
import type { SyncStatus } from '@/utils/syncDetection';
import { cn } from '@/lib/utils';

interface SlotSelectorProps {
  slotNames: string[];
  activeSlotIndex: number;
  syncStatus: SyncStatus;
  onSlotSelect: (index: number) => void;
  onRefreshSlots: () => void;
  isLoadingSlots: boolean;
  isDeviceConnected: boolean;
}

export function SlotSelector({
  slotNames,
  activeSlotIndex,
  syncStatus,
  onSlotSelect,
  onRefreshSlots,
  isLoadingSlots,
  isDeviceConnected
}: SlotSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Device Slots
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshSlots}
          disabled={!isDeviceConnected || isLoadingSlots}
        >
          <RefreshCw className={cn(
            'w-4 h-4 mr-2',
            isLoadingSlots && 'animate-spin'
          )} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {slotNames.map((name, index) => (
          <SlotCard
            key={index}
            slotIndex={index}
            slotName={name}
            isActive={index === activeSlotIndex}
            syncStatus={index === activeSlotIndex ? syncStatus : 'unknown'}
            onClick={() => onSlotSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}
