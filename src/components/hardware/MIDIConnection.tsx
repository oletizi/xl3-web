import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, Usb } from 'lucide-react';

interface MIDIConnectionProps {
  isSupported: boolean;
  isInitialized: boolean;
  devices: WebMidi.MIDIInput[];
  xl3Device: WebMidi.MIDIInput | null;
  error: string | null;
}

export const MIDIConnection = ({
  isSupported,
  isInitialized,
  devices,
  xl3Device,
  error
}: MIDIConnectionProps) => {
  const getWebMIDIStatus = () => {
    if (!isSupported) {
      return {
        label: 'Not Supported',
        variant: 'destructive' as const,
        icon: <XCircle className="w-3 h-3" />
      };
    }

    if (!isInitialized) {
      return {
        label: 'Initializing',
        variant: 'secondary' as const,
        icon: <AlertCircle className="w-3 h-3" />
      };
    }

    return {
      label: 'Ready',
      variant: 'default' as const,
      icon: <CheckCircle className="w-3 h-3" />
    };
  };

  const getConnectionStatus = () => {
    if (xl3Device) {
      return {
        label: 'Connected',
        variant: 'default' as const,
        icon: <CheckCircle className="w-3 h-3" />
      };
    }

    if (devices.length > 0) {
      return {
        label: 'Other Devices',
        variant: 'secondary' as const,
        icon: <Usb className="w-3 h-3" />
      };
    }

    return {
      label: 'Not Connected',
      variant: 'outline' as const,
      icon: <XCircle className="w-3 h-3" />
    };
  };

  const webMIDIStatus = getWebMIDIStatus();
  const connectionStatus = getConnectionStatus();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Usb className="w-4 h-4" />
          MIDI Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">WebMIDI:</span>
          <Badge variant={webMIDIStatus.variant} className="flex items-center gap-1">
            {webMIDIStatus.icon}
            {webMIDIStatus.label}
          </Badge>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-xs text-destructive">{error}</div>
          </div>
        )}

        {isSupported && !error && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={connectionStatus.variant} className="flex items-center gap-1">
              {connectionStatus.icon}
              {connectionStatus.label}
            </Badge>
          </div>
        )}

        {xl3Device && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-green-800 truncate">
                {xl3Device.name}
              </div>
            </div>
          </div>
        )}

        {isSupported && !error && devices.length === 0 && isInitialized && (
          <div className="text-center py-2 text-xs text-muted-foreground">
            No MIDI devices detected
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MIDIConnection;