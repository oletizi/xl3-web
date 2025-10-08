import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait 1 second to allow auth state to update, then redirect to home
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Completing sign in...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we set up your session
              </p>
            </div>

            <div className="space-y-3 mt-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
