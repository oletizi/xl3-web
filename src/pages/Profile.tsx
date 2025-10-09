/**
 * Profile Page
 *
 * Main user profile page allowing users to view and update their screen name.
 * Integrates ProfileHeader and ScreenNameSection components.
 */

import { useUserProfile } from '@/hooks/use-user-profile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ScreenNameSection } from '@/components/profile/ScreenNameSection';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { ProfileError } from '@/components/profile/ProfileError';
import { Separator } from '@/components/ui/separator';

export function Profile() {
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ProfileError error={error as Error} />;
  }

  if (!profile) {
    return <ProfileError error={new Error('Profile not found')} />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader profile={profile} />
      <Separator className="my-6" />
      <ScreenNameSection profile={profile} />
    </div>
  );
}

export default Profile;
