
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  refetchUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

async function getCurrentUser(): Promise<User | null> {
    try {
        const res = await fetch('/api/user');
        if (!res.ok) return null;
        const data = await res.json();
        return data.user;
    } catch (error) {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUser = async () => {
    setLoading(true);
    const user = await getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, refetchUser: fetchUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
