import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  Heart,
  Star,
  TrendingUp,
  Clock,
  Users,
  Filter,
  Globe,
  Award,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for community modes
  const featuredModes = [
    {
      id: "f1",
      name: "Pro Studio Template",
      description: "Professional studio mixing setup used by Grammy winners",
      author: "StudioMaster",
      category: "Professional",
      tags: ["mixing", "studio", "professional"],
      downloads: 2540,
      likes: 1892,
      rating: 4.9,
      thumbnail: "gradient-primary",
      featured: true
    },
    {
      id: "f2",
      name: "Live DJ Performance",
      description: "Perfect for live DJ sets and club performances",
      author: "DJProAudio",
      category: "Performance",
      tags: ["dj", "live", "performance", "club"],
      downloads: 1876,
      likes: 1432,
      rating: 4.8,
      thumbnail: "gradient-secondary",
      featured: true
    },
  ];

  const popularModes = [
    {
      id: "p1",
      name: "Beginner's DAW Control",
      description: "Simple setup for newcomers to digital audio workstations",
      author: "EasyAudio",
      category: "Educational",
      tags: ["beginner", "daw", "simple"],
      downloads: 5420,
      likes: 2156,
      rating: 4.7,
      thumbnail: "gradient-accent"
    },
    {
      id: "p2",
      name: "Trap Producer Kit",
      description: "Optimized for trap and hip-hop production workflows",
      author: "BeatMaker808",
      category: "Genre",
      tags: ["trap", "hiphop", "beats"],
      downloads: 3890,
      likes: 1765,
      rating: 4.6,
      thumbnail: "gradient-primary"
    },
    {
      id: "p3",
      name: "Ambient Soundscape",
      description: "Perfect for creating atmospheric and ambient music",
      author: "AtmosphericSounds",
      category: "Genre",
      tags: ["ambient", "atmospheric", "soundscape"],
      downloads: 2134,
      likes: 987,
      rating: 4.5,
      thumbnail: "gradient-secondary"
    },
  ];

  const ModeCard = ({ mode, index, large = false }: { mode: any, index: number, large?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`p-6 bg-gradient-surface border-border/50 hover:border-primary/50 transition-all duration-200 group ${large ? 'lg:p-8' : ''}`}>
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className={`${large ? 'h-32' : 'h-24'} rounded-lg bg-${mode.thumbnail} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
            <div className="absolute top-2 right-2 flex space-x-1">
              {mode.featured && (
                <Badge className="bg-warning text-warning-foreground">
                  <Award className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <div className="absolute bottom-2 left-2">
              <div className="flex items-center space-x-2 text-white/90">
                <div className="flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span className="text-xs">{mode.downloads.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span className="text-xs">{mode.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className={`font-semibold text-foreground group-hover:text-primary transition-colors ${large ? 'text-lg' : ''}`}>
                {mode.name}
              </h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm text-muted-foreground">{mode.rating}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              by <span className="text-primary">{mode.author}</span>
            </p>
            
            <p className={`text-sm text-muted-foreground ${large ? '' : 'line-clamp-2'}`}>
              {mode.description}
            </p>

            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {mode.category}
              </Badge>
              {mode.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{mode.downloads}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground shadow-glow-primary">
                <Download className="w-4 h-4 mr-2" />
                Download
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
            Community Catalog
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover and share custom modes with the community
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-muted-foreground">
            <Globe className="w-3 h-3 mr-1" />
            Public
          </Badge>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-2 max-w-2xl"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search community modes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Featured Modes */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Featured Modes</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredModes.map((mode, index) => (
            <ModeCard key={mode.id} mode={mode} index={index} large />
          ))}
        </div>
      </motion.section>

      {/* Browse Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="popular" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="popular">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="top">
              <Star className="w-4 h-4 mr-2" />
              Top Rated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularModes.map((mode, index) => (
                <ModeCard key={mode.id} mode={mode} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularModes.slice().reverse().map((mode, index) => (
                <ModeCard key={mode.id} mode={mode} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="top" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularModes.slice().sort((a, b) => b.rating - a.rating).map((mode, index) => (
                <ModeCard key={mode.id} mode={mode} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Categories */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "DAW Control", count: 156, color: "primary" },
            { name: "Live Performance", count: 89, color: "secondary" },
            { name: "Mixing & Mastering", count: 134, color: "accent" },
            { name: "Genre-Specific", count: 201, color: "warning" },
          ].map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="p-4 bg-gradient-surface border-border/50 hover:border-primary/50 transition-all duration-200 cursor-pointer group">
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 mx-auto rounded-lg bg-${category.color}/20 flex items-center justify-center group-hover:bg-${category.color}/30 transition-colors`}>
                    <div className={`w-6 h-6 bg-${category.color} rounded`} />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count} modes
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default Catalog;