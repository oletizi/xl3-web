import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Download,
  Upload,
  RotateCcw,
  Settings,
  Sliders,
  Volume2,
  Zap,
  CloudUpload,
  ArrowDownToLine
} from "lucide-react";
import { motion } from "framer-motion";
import ControllerVisual from "@/components/editor/ControllerVisual";
import { CustomMode, ControlMapping } from "@/types/mode";
import { saveMode, loadMode } from "@/utils/fileStorage";
import { toast } from "sonner";
import { initializeDefaultControls, getControlInfo } from "@/utils/controlMetadata";
import { loadModeFromStorage, saveModeToStorage, clearModeFromStorage } from "@/utils/statePersistence";
import { useLCXL3Device } from "@/contexts/LCXL3Context";
import { lcxl3ModeToCustomMode, customModeToLCXL3Mode } from "@/utils/modeConverter";
import { VERSION as LCXL3_VERSION } from "@oletizi/launch-control-xl3";
import packageJson from "../../package.json";
import { SaveModeDialog } from "@/components/cloud-storage/SaveModeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useModeById } from "@/hooks/use-cloud-modes";

declare const __BUILD_TIMESTAMP__: string;

const Editor = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeIdParam = searchParams.get('mode');

  const [mode, setMode] = useState<CustomMode>(() => {
    const savedMode = loadModeFromStorage();
    if (savedMode) {
      return savedMode;
    }

    return {
      name: 'New Custom Mode',
      description: '',
      version: '1.0.0',
      controls: initializeDefaultControls(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
  });
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { device, isConnected: lcxl3Connected, fetchCurrentMode } = useLCXL3Device();

  // Fetch mode from cloud if ID is in query params
  const { data: cloudMode, isLoading: isLoadingCloudMode } = useModeById(
    modeIdParam || ''
  );

  const selectedControlInfo = selectedControl ? getControlInfo(selectedControl) : null;
  const selectedControlMapping = selectedControl ? mode.controls[selectedControl] : null;

  const updateControlProperty = (field: keyof ControlMapping, value: any) => {
    if (!selectedControl) return;

    setMode(prevMode => ({
      ...prevMode,
      controls: {
        ...prevMode.controls,
        [selectedControl]: {
          ...prevMode.controls[selectedControl],
          [field]: value
        }
      },
      modifiedAt: new Date().toISOString()
    }));
  };

  const handleSave = async () => {
    try {
      await saveMode(mode);
      toast.success('Mode saved successfully!');
    } catch (error) {
      toast.error('Failed to save mode');
      console.error('Save error:', error);
    }
  };

  const handleImport = async () => {
    try {
      const loadedMode = await loadMode();
      setMode(loadedMode);
      toast.success(`Loaded mode: ${loadedMode.name}`);
    } catch (error) {
      toast.error('Failed to load mode');
      console.error('Load error:', error);
    }
  };

  const handleReset = () => {
    clearModeFromStorage();

    setMode({
      name: 'New Custom Mode',
      description: '',
      version: '1.0.0',
      controls: initializeDefaultControls(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    });

    toast.success('Mode reset to defaults');
  };

  const handleLabelUpdate = (controlId: string, newLabel: string) => {
    setMode(prevMode => ({
      ...prevMode,
      controls: {
        ...prevMode.controls,
        [controlId]: {
          ...prevMode.controls[controlId],
          label: newLabel
        }
      },
      modifiedAt: new Date().toISOString()
    }));
  };

  const handleFetch = async () => {
    try {
      toast.info('Fetching mode from device...');

      const lcxl3Mode = await fetchCurrentMode();
      console.log('Raw mode from device:', lcxl3Mode);
      console.log('Controls array:', lcxl3Mode.controls);

      // Log a sample control from the Record
      const firstControlEntry = Object.entries(lcxl3Mode.controls)[0];
      if (firstControlEntry) {
        console.log('First control key:', firstControlEntry[0]);
        console.log('First control value:', firstControlEntry[1]);
      }

      const fetchedMode = lcxl3ModeToCustomMode(lcxl3Mode);
      console.log('Converted mode:', fetchedMode);
      console.log('Sample fetched control:', Object.entries(fetchedMode.controls)[0]);

      // Merge with defaults, but preserve fetched labels
      const defaultControls = initializeDefaultControls();
      const mergedControls: Record<string, any> = {};

      for (const [id, defaultControl] of Object.entries(defaultControls)) {
        const fetchedControl = fetchedMode.controls[id];
        if (fetchedControl) {
          // Use fetched control, which has the correct label
          mergedControls[id] = fetchedControl;
        } else {
          // Use default control if not fetched
          mergedControls[id] = defaultControl;
        }
      }

      setMode({
        ...fetchedMode,
        controls: mergedControls
      });

      toast.success('Mode fetched successfully from device!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch mode';
      toast.error(`Fetch failed: ${message}`);
      console.error('Fetch error:', error);
    }
  };

  const handleSend = async () => {
    if (!device) {
      toast.error('Device not connected');
      return;
    }

    try {
      toast.info('Sending mode to device...');

      const lcxl3Mode = customModeToLCXL3Mode(mode);
      await device.saveCustomMode(0, lcxl3Mode);

      toast.success('Mode sent successfully to device!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send mode';
      toast.error(`Send failed: ${message}`);
      console.error('Send error:', error);
    }
  };

  const handleCloudSaveSuccess = (modeId: string) => {
    toast.success('Mode saved to cloud!', {
      description: 'You can find it in your library.',
      action: {
        label: 'View Library',
        onClick: () => navigate('/library')
      }
    });
  };

  // Effect to load cloud mode when fetched from query parameter
  useEffect(() => {
    if (cloudMode && modeIdParam) {
      // Convert CloudMode to CustomMode format for editor
      setMode({
        name: cloudMode.name,
        description: cloudMode.description || '',
        version: cloudMode.version,
        controls: cloudMode.controls,
        createdAt: cloudMode.createdAt,
        modifiedAt: cloudMode.modifiedAt,
      });

      // Clear the query parameter after loading
      setSearchParams({});

      // Show success toast
      toast.success('Mode loaded', {
        description: `${cloudMode.name} is ready to edit.`,
      });
    }
  }, [cloudMode, modeIdParam, setSearchParams]);

  useEffect(() => {
    saveModeToStorage(mode);
  }, [mode]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mode Editor
          </h1>
          <p className="text-muted-foreground mt-2">
            Design custom control mappings for your Launch Control XL3
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            UI version: {packageJson.version}; Library version: @oletizi/launch-control-xl3@{packageJson.dependencies["@oletizi/launch-control-xl3"].replace("^", "")} | Built: {new Date(__BUILD_TIMESTAMP__).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleImport} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleSave} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleFetch}
            disabled={!lcxl3Connected}
            size="sm"
            className="bg-accent text-accent-foreground shadow-glow-accent"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Fetch
          </Button>
          <Button
            onClick={handleSend}
            disabled={!lcxl3Connected}
            size="sm"
            className="bg-secondary text-secondary-foreground shadow-glow-secondary"
          >
            <Play className="w-4 h-4 mr-2" />
            Send
          </Button>
          {isAuthenticated && (
            <Button
              onClick={() => setSaveDialogOpen(true)}
              size="sm"
              className="bg-accent text-accent-foreground shadow-glow-accent"
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              Save to Cloud
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Editor Area */}
        <div className="xl:col-span-3 space-y-6">
          {/* Controller Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 bg-gradient-surface border-border/50">
              <ControllerVisual
                selectedControl={selectedControl}
                onControlSelect={setSelectedControl}
                controls={mode.controls}
                onLabelUpdate={handleLabelUpdate}
              />
            </Card>
          </motion.div>
        </div>

        {/* Properties Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Mode Info */}
          <Card className="p-6 bg-gradient-surface border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Mode Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mode-name" className="text-foreground">Mode Name</Label>
                <Input
                  id="mode-name"
                  value={mode.name}
                  onChange={(e) => setMode({...mode, name: e.target.value})}
                  className="mt-2 bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="mode-description" className="text-foreground">Description</Label>
                <Textarea
                  id="mode-description"
                  value={mode.description}
                  onChange={(e) => setMode({...mode, description: e.target.value})}
                  className="mt-2 bg-background/50 resize-none"
                  rows={3}
                  placeholder="Describe your custom mode..."
                />
              </div>
            </div>
          </Card>

          {/* Control Properties */}
          <Card className="p-6 bg-gradient-surface border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Control Properties</h3>
            
            {selectedControl ? (
              <Tabs defaultValue="mapping" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mapping">Mapping</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mapping" className="space-y-4">
                  <div>
                    <Label className="text-foreground">Control Type</Label>
                    <Badge variant="secondary" className="ml-2">
                      CC {selectedControlInfo?.cc}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label htmlFor="cc-number" className="text-foreground">CC Number</Label>
                    <Input
                      id="cc-number"
                      type="number"
                      min="0"
                      max="127"
                      value={selectedControlMapping?.ccNumber || 0}
                      onChange={(e) => updateControlProperty('ccNumber', parseInt(e.target.value))}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="midi-channel" className="text-foreground">MIDI Channel</Label>
                    <Input
                      id="midi-channel"
                      type="number"
                      min="1"
                      max="16"
                      value={selectedControlMapping?.midiChannel || 1}
                      onChange={(e) => updateControlProperty('midiChannel', parseInt(e.target.value))}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-val" className="text-foreground">Min Value</Label>
                      <Input
                        id="min-val"
                        type="number"
                        min="0"
                        max="127"
                        value={selectedControlMapping?.minValue || 0}
                        onChange={(e) => updateControlProperty('minValue', parseInt(e.target.value))}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-val" className="text-foreground">Max Value</Label>
                      <Input
                        id="max-val"
                        type="number"
                        min="0"
                        max="127"
                        value={selectedControlMapping?.maxValue || 127}
                        onChange={(e) => updateControlProperty('maxValue', parseInt(e.target.value))}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <Label htmlFor="control-name" className="text-foreground">Control Label</Label>
                    <Input
                      id="control-name"
                      placeholder="Custom name..."
                      value={selectedControlMapping?.label || ''}
                      onChange={(e) => updateControlProperty('label', e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">LED Feedback</Label>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Curve Type</Label>
                    <Button variant="outline" size="sm">
                      <Sliders className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center p-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Select a control on the device to configure its properties
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Save to Cloud Dialog */}
      <SaveModeDialog
        mode={mode}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSuccess={handleCloudSaveSuccess}
      />
    </div>
  );
};

export default Editor;