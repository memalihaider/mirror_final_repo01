'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserRole, setUserRole as createUserRole, UserRole } from '@/lib/auth';
import { auth, initializeFirebase } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  accessiblePages: string[];
  canAccessPage: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  error: null,
  accessiblePages: [],
  canAccessPage: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Start with true
  const [error, setError] = useState<string | null>(null);
  const [accessiblePages, setAccessiblePages] = useState<string[]>([]);

  const canAccessPage = (page: string) => {
    if (!userRole) return false;
    if (userRole.role === 'admin') return true; // ✅ Admin bypass
    return accessiblePages.includes(page);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        setLoading(true);
        await initializeFirebase();

        unsubscribe = onAuthStateChange(async (user) => {
          if (!isMounted) return;
          setUser(user);
          setError(null);

          if (user) {
            try {
              let role = await getUserRole(user.uid);

              // ✅ If no role exists, create one
              if (!role && user.email) {
                const defaultRole = user.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
                await createUserRole(
                  user.uid,
                  user.email,
                  defaultRole,
                  user.displayName || undefined,
                  []
                );
                role = await getUserRole(user.uid);
              }

              // ✅ Ensure admin stays admin
              if (role?.role !== 'admin' && user.email === 'ahmadxeikh786@gmail.com') {
                await createUserRole(
                  user.uid,
                  user.email,
                  'admin',
                  user.displayName || undefined,
                  []
                );
                role = await getUserRole(user.uid);
              }

              if (isMounted) {
                setUserRole(role);
                setAccessiblePages(role?.accessPages || []);
              }
            } catch (error) {
              console.error('Error getting user role:', error);
              if (isMounted) setError('Failed to load user role');
            }
          } else {
            if (isMounted) {
              setUserRole(null);
              setAccessiblePages([]);
            }
          }

          if (isMounted) setLoading(false);
        });
      } catch (error) {
        console.error('Firebase initialization error:', error);
        if (isMounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const isAdmin = userRole?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, isAdmin, error, accessiblePages, canAccessPage }}
    >
      {children}
    </AuthContext.Provider>
  );
};
