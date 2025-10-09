import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Edit,
  Heart,
  Eye,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Play,
} from "lucide-react";
import { motion } from "framer-motion";
import { useModeById } from "@/hooks/use-cloud-modes";
import { formatDistanceToNow } from "date-fns";

const ModeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: mode, isLoading, error } = useModeById(id || "");

  // Handle loading into editor
  const handleLoad = () => {
    if (mode) {
      navigate(`/?mode=${mode.id}`);
    }
  };

  // Handle editing
  const handleEdit = () => {
    if (mode) {
      navigate(`/?mode=${mode.id}&edit=true`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !mode) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold mb-2">Mode Not Found</h2>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error ? error.message : "The requested mode could not be found"}
        </p>
        <Button onClick={() => navigate("/library")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/library")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Library
      </Button>

      {/* Mode header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              {mode.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {mode.author?.screenName || "Unknown Author"}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDistanceToNow(new Date(mode.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button onClick={handleLoad} className="bg-primary text-primary-foreground">
              <Play className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button onClick={handleEdit} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {mode.likes}
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {mode.downloads}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {mode.views}
          </div>
        </div>

        {/* Category */}
        {mode.category && (
          <Badge variant="secondary" className="capitalize">
            {mode.category.replace("-", " ")}
          </Badge>
        )}

        {/* Description */}
        {mode.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{mode.description}</p>
          </div>
        )}

        {/* Tags */}
        {mode.tags && mode.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {mode.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Control count */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Configuration</h3>
          <p className="text-sm text-muted-foreground">
            This mode contains {Object.keys(mode.controls || {}).length} control mappings
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ModeDetail;
