import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

interface StorageStatusProps {
  isDirty: boolean;
  lastSaved: number | null;
  storageSize: number;
  onManualSave: () => void;
  onClearStorage: () => void;
}

export const StorageStatus = ({
  isDirty,
  lastSaved,
  storageSize,
  onManualSave,
  onClearStorage,
}: StorageStatusProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('Never');

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    setTimeAgo(formatTimeAgo(lastSaved));

    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastSaved));
    }, 10000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await onManualSave();
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleClearStorage = () => {
    if (showClearConfirm) {
      onClearStorage();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-t text-xs">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isDirty ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
          }`}
          title={isDirty ? 'Unsaved changes' : 'All changes saved'}
        />
        <span className="text-muted-foreground">
          {isDirty ? 'Unsaved' : 'Saved'} {timeAgo}
        </span>
      </div>

      <div className="text-muted-foreground">
        {formatStorageSize(storageSize)}
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleManualSave}
        disabled={isSaving || !isDirty}
        className="h-7 px-2"
      >
        {isSaving ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          <>
            <Save className="w-3 h-3 mr-1" />
            Save
          </>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearStorage}
        className={`h-7 px-2 ${
          showClearConfirm ? 'bg-destructive text-destructive-foreground' : ''
        }`}
      >
        <Trash2 className="w-3 h-3 mr-1" />
        {showClearConfirm ? 'Confirm?' : 'Clear'}
      </Button>
    </div>
  );
};

export default StorageStatus;