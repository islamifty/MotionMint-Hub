
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        // Fetch user profile from Firestore to get the role
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const appUser: User = {
              id: user.uid,
              name: userData.name || user.displayName || user.email || "User",
              email: user.email!,
              role: userData.role || 'user',
              initials: userData.initials || (user.displayName || user.email || 'U').substring(0,2).toUpperCase(),
          };
          setCurrentUser(appUser);
        } else {
            // Fallback if the user doc doesn't exist for some reason
            const fallbackUser: User = {
                id: user.uid,
                name: user.displayName || user.email || "User",
                email: user.email!,
                role: 'user',
                initials: (user.displayName || user.email || 'U').substring(0,2).toUpperCase(),
            };
            setCurrentUser(fallbackUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
