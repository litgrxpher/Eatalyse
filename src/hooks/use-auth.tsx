
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuthInstance, getFirestoreInstance, isFirebaseConfigured } from '@/lib/firebase';
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
    console.log('🔐 AuthProvider - Starting authentication setup');
    console.log('🔐 AuthProvider - Firebase configured:', isFirebaseConfigured());
    
    if (!isFirebaseConfigured()) {
      console.log('❌ AuthProvider - Firebase not configured, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuthInstance();
      console.log('✅ AuthProvider - Got auth instance:', !!auth);
      
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('🔄 AuthProvider - Auth state changed:', {
          uid: currentUser?.uid,
          email: currentUser?.email,
          displayName: currentUser?.displayName
        });
        
        setUser(currentUser);
        
        if (currentUser) {
          console.log('👤 AuthProvider - User authenticated, setting up profile listener');
          try {
            const db = getFirestoreInstance();
            console.log('✅ AuthProvider - Got Firestore instance, setting up profile listener for user:', currentUser.uid);
            
            const profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
              console.log('📄 AuthProvider - Profile document updated:', {
                exists: doc.exists(),
                data: doc.exists() ? doc.data() : null
              });
              
              if (doc.exists()) {
                const profileData = doc.data() as UserProfile;
                console.log('✅ AuthProvider - Setting user profile:', profileData);
                setUserProfile(profileData);
              } else {
                console.log('⚠️ AuthProvider - No profile document found, creating one...');
                // Try to create a profile if it doesn't exist
                setUserProfile(null);
              }
              setLoading(false);
            }, (error) => {
              console.error("❌ AuthProvider - Error fetching user profile:", error);
              console.error("❌ AuthProvider - Error details:", {
                code: (error as any).code,
                message: error.message,
                stack: error.stack
              });
              setUserProfile(null);
              setLoading(false);
            });
            return () => profileUnsubscribe();
          } catch (error) {
            console.error("❌ AuthProvider - Error getting Firestore instance:", error);
            console.error("❌ AuthProvider - Firestore error details:", {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            setUserProfile(null);
            setLoading(false);
          }
        } else {
          console.log('🚪 AuthProvider - No user, clearing profile and setting loading to false');
          setUserProfile(null);
          setLoading(false);
        }
      }, (error) => {
        console.error("❌ AuthProvider - Error in auth state change:", error);
        console.error("❌ AuthProvider - Auth error details:", {
          code: (error as any).code,
          message: error.message,
          stack: error.stack
        });
        setLoading(false);
      });

      return () => {
        console.log('🧹 AuthProvider - Cleaning up auth listener');
        unsubscribe();
      };
    } catch (error) {
      console.error("❌ AuthProvider - Error getting Auth instance:", error);
      console.error("❌ AuthProvider - Auth instance error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setLoading(false);
    }
  }, []);

  console.log('🔐 AuthProvider - Current state:', { 
    user: user?.uid, 
    userProfile: !!userProfile, 
    loading,
    userEmail: user?.email,
    userDisplayName: user?.displayName
  });

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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { loading };
};
