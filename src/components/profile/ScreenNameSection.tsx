/**
 * ScreenNameSection Component
 *
 * Orchestrates screen name selection flow with save/cancel actions.
 * Collapsed by default to reduce visual clutter.
 */

import { useState } from 'react';
import { UserProfile } from '@/services/user-profile-service';
import { useUpdateScreenName } from '@/hooks/use-user-profile';
import { ScreenNamePicker } from '@/components/profile/ScreenNamePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ScreenNameSectionProps {
  profile: UserProfile;
}

export function ScreenNameSection({ profile }: ScreenNameSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScreenName, setSelectedScreenName] = useState<string>();
  const updateScreenName = useUpdateScreenName();

  const handleSave = () => {
    if (selectedScreenName && selectedScreenName !== profile.screenName) {
      updateScreenName.mutate(selectedScreenName, {
        onSuccess: () => {
          setSelectedScreenName(undefined);
        },
      });
    }
  };

  const handleCancel = () => {
    setSelectedScreenName(undefined);
  };

  const hasChanges = selectedScreenName && selectedScreenName !== profile.screenName;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <CardTitle>Screen Name</CardTitle>
              <CardDescription>
                Update your screen name to personalize your profile
              </CardDescription>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="space-y-4">
            <ScreenNamePicker
              currentScreenName={profile.screenName}
              onSelect={setSelectedScreenName}
              selectedScreenName={selectedScreenName}
            />

            {hasChanges && (
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateScreenName.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateScreenName.isPending}
                >
                  {updateScreenName.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Screen Name'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
