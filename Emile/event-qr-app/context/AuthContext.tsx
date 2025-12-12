import { auth } from '@/config/firebase';
import { AuthContextType, User } from '@/types';
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api'
  : 'https://backend-estudio123455-hues-projects.vercel.app/api';

export type UserRole = 'user' | 'organizer';

export interface UserProfile extends User {
  role?: UserRole;
}

// Sync user with backend after Firebase auth
const syncUserWithBackend = async (firebaseUser: FirebaseUser, role?: UserRole): Promise<UserProfile | null> => {
  try {
    const idToken = await firebaseUser.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.user) {
      return data.data.user;
    }
    
    // Fallback to Firebase user data
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      role: 'user',
    };
  } catch (error) {
    console.error('Error syncing with backend:', error);
    // Return basic user info on error
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      role: 'user',
    };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, sync with backend
        const userProfile = await syncUserWithBackend(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sync with backend (onAuthStateChanged will also trigger)
      const userProfile = await syncUserWithBackend(userCredential.user);
      setUser(userProfile);
      return true;
    } catch (error: any) {
      console.error('Error during login:', error.code, error.message);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'user'): Promise<boolean> => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name in Firebase
      await updateProfile(firebaseUser, { displayName: name });

      // Sync with backend (creates user in DB with role)
      const userProfile = await syncUserWithBackend(firebaseUser, role);
      setUser(userProfile);
      return true;
    } catch (error: any) {
      console.error('Error during registration:', error.code, error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
