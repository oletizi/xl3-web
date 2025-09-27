import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Grid, 
  List, 
  Filter, 
  Download, 
  Upload,
  Plus,
  Edit3,
  Trash2,
  Play,
  Star,
  Calendar,
  Tag
} from "lucide-react";
import { motion } from "framer-motion";

const Library = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for user's modes
  const userModes = [
    {
      id: "1",
      name: "Ableton Live Performance",
      description: "Perfect setup for live performances with Ableton Live",
      category: "DAW Control",
      tags: ["ableton", "live", "performance"],
      createdAt: "2024-01-15",
      lastModified: "2024-01-20",
      isStarred: true,
      thumbnail: "gradient-primary"
    },
    {
      id: "2", 
      name: "Synthesizer Control",
      description: "Hardware synth parameter control mapping",
      category: "Instrument",
      tags: ["synth", "hardware", "parameters"],
      createdAt: "2024-01-10",
      lastModified: "2024-01-18",
      isStarred: false,
      thumbnail: "gradient-secondary"
    },
    {
      id: "3",
      name: "Mixing Console",
      description: "Traditional mixing board layout for studio work",
      category: "Mixing",
      tags: ["mixing", "studio", "console"],
      createdAt: "2024-01-05",
      lastModified: "2024-01-15",
      isStarred: true,
      thumbnail: "gradient-accent"
    },
  ];

  const ModeCard = ({ mode, index }: { mode: typeof userModes[0], index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-6 bg-gradient-surface border-border/50 hover:border-primary/50 transition-all duration-200 group">
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className={`h-24 rounded-lg bg-${mode.thumbnail} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
            <div className="absolute top-2 right-2 flex space-x-1">
              {mode.isStarred && (
                <Star className="w-4 h-4 text-warning fill-warning" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {mode.name}
              </h3>
              <Badge variant="outline" className="text-xs">
                {mode.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {mode.description}
            </p>

            <div className="flex flex-wrap gap-1">
              {mode.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date(mode.lastModified).toLocaleDateString()}
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm">
                <Play className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

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
            My Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom modes and presets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button size="sm" className="bg-secondary text-secondary-foreground shadow-glow-secondary">
            <Plus className="w-4 h-4 mr-2" />
            New Mode
          </Button>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search your modes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Badge variant="outline" className="text-muted-foreground">
            {userModes.length} modes
          </Badge>
        </div>
      </motion.div>

      {/* Modes Grid/List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {userModes.map((mode, index) => (
          <ModeCard key={mode.id} mode={mode} index={index} />
        ))}
      </motion.div>

      {/* Empty State (if no modes) */}
      {userModes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
            <Tag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No modes yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first custom mode or import existing ones to get started.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Button className="bg-primary text-primary-foreground shadow-glow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Mode
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Mode
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Library;