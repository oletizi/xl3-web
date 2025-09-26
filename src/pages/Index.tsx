import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Edit3, 
  Library, 
  Globe, 
  Play,
  Download,
  Users,
  Music,
  Settings,
  Sliders,
  ArrowRight,
  Star,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const features = [
    {
      icon: Edit3,
      title: "Visual Mode Editor",
      description: "Intuitive drag-and-drop interface for creating custom control mappings with real-time preview.",
      color: "primary"
    },
    {
      icon: Library,
      title: "Personal Library",
      description: "Store, organize, and manage your custom modes with cloud sync and local backup.",
      color: "secondary"
    },
    {
      icon: Globe,
      title: "Community Catalog",
      description: "Discover and share custom modes with producers and DJs worldwide.",
      color: "accent"
    },
    {
      icon: Activity,
      title: "Live Integration",
      description: "Real-time WebMIDI connection with your Launch Control XL3 for instant testing.",
      color: "warning"
    }
  ];

  const stats = [
    { label: "Active Users", value: "12.5K", icon: Users },
    { label: "Custom Modes", value: "45.2K", icon: Settings },
    { label: "Downloads", value: "182K", icon: Download },
    { label: "Rating", value: "4.9", icon: Star }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            {/* Hero Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Professional MIDI Controller Interface
              </Badge>
            </motion.div>

            {/* Hero Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Launch Control XL3
              </span>
              <br />
              <span className="text-foreground">Web Editor</span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Design custom control mappings, manage your library, and share modes with the global music production community. Professional-grade tools for your Launch Control XL3.
            </motion.p>

            {/* Hero Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/editor">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground shadow-glow-primary hover:scale-105 transition-transform"
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Link to="/catalog">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Browse Catalog
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-primary mr-2" />
                      <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-surface">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Professional Tools for Music Production
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, manage, and share custom control modes for your Launch Control XL3
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-${feature.color}/20 flex items-center justify-center group-hover:bg-${feature.color}/30 transition-colors`}>
                        <Icon className={`w-6 h-6 text-${feature.color}`} />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Transform Your Workflow?
            </h2>
            
            <p className="text-lg text-muted-foreground">
              Join thousands of producers and DJs who are already using Launch Control XL3 Web Editor to enhance their creative process.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/editor">
                <Button 
                  size="lg" 
                  className="bg-secondary text-secondary-foreground shadow-glow-secondary hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Your First Mode
                </Button>
              </Link>
              
              <Link to="/library">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-secondary/50 hover:bg-secondary/10"
                >
                  <Library className="w-5 h-5 mr-2" />
                  Explore Library
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground pt-8">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4" />
                <span>Professional Grade</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Real-time Preview</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Community Driven</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
