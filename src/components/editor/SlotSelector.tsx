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

      <div className="space-y-2">
        {/* First row: slots 0-7 */}
        <div className="flex gap-2">
          {slotNames.slice(0, 8).map((name, index) => (
            <div key={index} className="flex-1 min-w-0">
              <SlotCard
                slotIndex={index}
                slotName={name}
                isActive={index === activeSlotIndex}
                syncStatus={index === activeSlotIndex ? syncStatus : 'unknown'}
                onClick={() => onSlotSelect(index)}
              />
            </div>
          ))}
        </div>

        {/* Second row: slots 8-14 */}
        <div className="flex gap-2">
          {slotNames.slice(8, 15).map((name, index) => (
            <div key={index + 8} className="flex-1 min-w-0">
              <SlotCard
                slotIndex={index + 8}
                slotName={name}
                isActive={index + 8 === activeSlotIndex}
                syncStatus={index + 8 === activeSlotIndex ? syncStatus : 'unknown'}
                onClick={() => onSlotSelect(index + 8)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
