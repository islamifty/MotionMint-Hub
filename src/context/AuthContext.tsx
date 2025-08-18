
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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

const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        // This is where you would fetch user profile from Firestore/DB
        // For now, we'll create a user object based on the auth state
        const isAdmin = user.email ? adminEmails.includes(user.email) : false;
        const appUser: User = {
            id: user.uid,
            name: user.displayName || user.email || "User",
            email: user.email!,
            role: isAdmin ? 'admin' : 'user',
            initials: (user.displayName || user.email || 'U').substring(0,2).toUpperCase(),
        };
        setCurrentUser(appUser);
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
