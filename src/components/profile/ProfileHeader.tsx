/**
 * ProfileHeader Component
 *
 * Displays user's current profile information including avatar, screen name, and join date.
 */

import { UserProfile } from '@/services/user-profile-service';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, User as UserIcon } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  // Get initials for fallback avatar
  const getInitials = (screenName: string): string => {
    const parts = screenName.split('-');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return screenName.substring(0, 2).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatarUrl} alt={profile.screenName} />
            <AvatarFallback className="text-2xl">
              {getInitials(profile.screenName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center space-x-3">
                <h1
                  className="text-3xl font-bold"
                  data-testid="current-screen-name"
                >
                  {profile.screenName}
                </h1>
                <Badge variant="secondary">
                  <UserIcon className="h-3 w-3 mr-1" />
                  User
                </Badge>
              </div>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Joined {formatDate(profile.createdAt)}</span>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
