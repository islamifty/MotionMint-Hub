
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

async function fetchCurrentUser(): Promise<User | null> {
    try {
        const res = await fetch('/api/user', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user;
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const refetchUser = useCallback(async () => {
    setLoading(true);
    const user = await fetchCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
