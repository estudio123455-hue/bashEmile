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

// Sync user with backend after login (NEVER sends role - role is read-only)
const syncUserWithBackend = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
  try {
    const idToken = await firebaseUser.getIdToken();
    
    // SECURITY: Never send role in sync - role is immutable after registration
    const response = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({}), // Empty body - no role
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
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      role: 'user',
    };
  }
};

// Register user with backend (ONLY place where role is set)
const registerUserWithBackend = async (firebaseUser: FirebaseUser, role: UserRole): Promise<UserProfile | null> => {
  try {
    const idToken = await firebaseUser.getIdToken();
    
    // Role is ONLY sent during registration
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
    
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      role: role,
    };
  } catch (error) {
    console.error('Error registering with backend:', error);
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      role: role,
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

      // Register with backend (ONLY place where role is set)
      const userProfile = await registerUserWithBackend(firebaseUser, role);
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
