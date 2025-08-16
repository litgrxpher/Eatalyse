
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export function UserNav() {
  const { user, userProfile } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = userProfile?.displayName || user.displayName;
  const email = user.email;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" className="relative h-8 w-8 rounded-full">
            <Link href="/settings">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={displayName || 'User'}
                />
                <AvatarFallback>
                  {displayName
                    ? displayName.charAt(0).toUpperCase()
                    : email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="font-semibold">{displayName}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
