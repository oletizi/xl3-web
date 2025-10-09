/**
 * ScreenNamePicker Component
 *
 * Generates and displays screen name options with radio selection.
 * Includes regenerate functionality.
 */

import { useGenerateScreenNames } from '@/hooks/use-user-profile';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw } from 'lucide-react';

interface ScreenNamePickerProps {
  currentScreenName: string;
  onSelect: (screenName: string) => void;
  selectedScreenName?: string;
}

export function ScreenNamePicker({
  currentScreenName,
  onSelect,
  selectedScreenName,
}: ScreenNamePickerProps) {
  const { data: options, isLoading, refetch, isFetching } = useGenerateScreenNames(10);

  const handleRegenerate = () => {
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a Screen Name</CardTitle>
        <CardDescription>
          Select a friendly screen name from the options below, or regenerate for more choices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : options && options.length > 0 ? (
          <RadioGroup value={selectedScreenName} onValueChange={onSelect}>
            <div className="space-y-3">
              {options.map((name) => (
                <div key={name} className="flex items-center space-x-2">
                  <RadioGroupItem value={name} id={name} />
                  <Label
                    htmlFor={name}
                    className="flex-1 cursor-pointer text-base hover:text-primary transition-colors"
                  >
                    {name}
                    {name === currentScreenName && (
                      <Badge variant="secondary" className="ml-2">
                        Current
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Failed to generate options. Please try regenerating.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Options
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
