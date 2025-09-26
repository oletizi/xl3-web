import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  RotateCcw,
  Settings,
  Sliders,
  Volume2,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import ControllerVisual from "@/components/editor/ControllerVisual";

const Editor = () => {
  const [modeName, setModeName] = useState("New Custom Mode");
  const [modeDescription, setModeDescription] = useState("");
  const [selectedControl, setSelectedControl] = useState<string | null>(null);

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
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="bg-secondary text-secondary-foreground shadow-glow-secondary">
            <Play className="w-4 h-4 mr-2" />
            Send
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground shadow-glow-primary">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
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
                  value={modeName}
                  onChange={(e) => setModeName(e.target.value)}
                  className="mt-2 bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="mode-description" className="text-foreground">Description</Label>
                <Textarea 
                  id="mode-description"
                  value={modeDescription}
                  onChange={(e) => setModeDescription(e.target.value)}
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
                      {selectedControl}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label htmlFor="cc-number" className="text-foreground">CC Number</Label>
                    <Input 
                      id="cc-number"
                      type="number" 
                      min="0" 
                      max="127" 
                      defaultValue="1"
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
                      defaultValue="1"
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
                        defaultValue="0"
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
                        defaultValue="127"
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
    </div>
  );
};

export default Editor;