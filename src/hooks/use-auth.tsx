
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
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  profileLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
        setLoading(false);
        setProfileLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      setUser(user);
      if (!user) {
        // If no user, no profile to load.
        setProfileLoading(false);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && db) {
      setProfileLoading(true); // Start loading profile
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          // This case might happen briefly after signup before profile is created
          setUserProfile(null);
        }
        setProfileLoading(false); // Done loading profile
      });
      return () => unsub();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const useRequireAuth = () => {
  const { user, loading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We want to wait for both auth state and profile to be loaded.
    if (!loading && !profileLoading && !user) {
      router.push('/login');
    }
  }, [user, loading, profileLoading, router]);

  // Return a combined loading state.
  return { user, loading: loading || profileLoading };
};
