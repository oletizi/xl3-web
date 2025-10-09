/**
 * ProfileError Component
 *
 * Error state display with retry and navigation options.
 */

import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ProfileErrorProps {
  error: Error;
}

export function ProfileError({ error }: ProfileErrorProps) {
  const navigate = useNavigate();
  const { refetch } = useUserProfile();

  const handleRetry = () => {
    refetch();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <span>Profile Error</span>
          </CardTitle>
          <CardDescription>
            We encountered an error loading your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An unknown error occurred while loading your profile.'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Button onClick={handleRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
