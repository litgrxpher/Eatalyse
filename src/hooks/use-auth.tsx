
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // If there's no user, we can immediately stop loading.
        setUserProfile(null);
        setLoading(false);
      }
      // If there IS a user, the second useEffect will handle setting loading to false.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // User is authenticated, now we fetch their profile.
      // We are still in a "loading" state until the profile is fetched.
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        // Once the profile is fetched (or we know it doesn't exist), we are done loading.
        setLoading(false);
      });
      return () => unsubProfile();
    }
    // If there is no user, the first useEffect handles setting loading to false.
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is complete before checking for a user.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // The user is considered "loading" until the auth state is resolved and the profile is fetched.
  return { user, loading };
};
