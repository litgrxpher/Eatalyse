
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export function UserNav() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Button asChild variant="ghost" className="relative h-8 w-8 rounded-full">
      <Link href="/settings">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
          <AvatarFallback>
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </Link>
    </Button>
  );
}
