import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Edit3, 
  Library, 
  Globe, 
  Settings, 
  Power,
  Zap,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Editor", icon: Edit3 },
    { path: "/library", label: "Library", icon: Library },
    { path: "/catalog", label: "Catalog", icon: Globe },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              XL 3
            </h1>
          </Link>

          <nav className="flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground shadow-glow-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            {/* Device Status Indicator */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-muted/50 hover:bg-muted/70"
            >
              <Activity className="w-4 h-4 text-destructive animate-pulse" />
              <span className="text-sm text-muted-foreground">Disconnected</span>
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>XL 3 Web UI - Professional Mode Editor</p>
            <div className="flex items-center space-x-4">
              <span>Build with ⚡ by Lovable</span>
              <div className="flex items-center space-x-2">
                <Power className="w-4 h-4" />
                <span>Ready</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;