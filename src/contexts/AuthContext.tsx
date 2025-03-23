import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { migrateLocalStorageToSupabase } from '../lib/supabase';

// Create a fake demo user that mimics Supabase user structure
const createDemoUser = (userId: string): User => ({
  id: userId,
  app_metadata: {},
  user_metadata: { name: 'Demo User' },
  aud: 'demo',
  created_at: new Date().toISOString(),
  email: 'demo@example.com',
  phone: '',
  role: '',
  updated_at: new Date().toISOString(),
});

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userId: string | null;
  dataMigrated: boolean;
  setDataMigrated: (migrated: boolean) => void;
  setDemoUser: (userId: string) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  userId: null,
  dataMigrated: false,
  setDataMigrated: () => {},
  setDemoUser: () => {},
  isDemoMode: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataMigrated, setDataMigrated] = useState(false);
  const [demoUserId, setDemoUserId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Set a demo user for local testing without Supabase auth
  const setDemoUser = (userId: string) => {
    console.log('Setting demo user:', userId);
    setDemoUserId(userId);
    setIsDemoMode(true);
    
    // Create a fake user object to mimic Supabase auth
    const demoUser = createDemoUser(userId);
    setUser(demoUser);
    
    // Create a fake session
    const demoSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: demoUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    setSession(demoSession);
    
    setLoading(false);
    localStorage.setItem('masternote_demo_user_id', userId);
  };

  // Check for previously stored demo user ID
  useEffect(() => {
    // We only want to check for a Supabase session
    const checkSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // We don't need to do anything with this session since the supabase 
        // auth change listener will handle it
      } catch (error) {
        console.error('Error checking auth session:', error);
      }
    };
    
    checkSupabaseSession();
  }, []);
  
  useEffect(() => {
    // If we're in demo mode, don't bother with Supabase auth
    if (isDemoMode) return;
    
    // Fetch the current session
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user || null);
        
        // If user is logged in, try to migrate data
        if (session?.user && !dataMigrated) {
          const migrationResult = await migrateLocalStorageToSupabase(session.user.id);
          setDataMigrated(migrationResult || false);
        }
      } catch (error) {
        console.error('Error fetching auth session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    // Clean up the subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [dataMigrated, isDemoMode]);

  const signOut = async () => {
    if (isDemoMode) {
      setDemoUserId(null);
      setIsDemoMode(false);
      setUser(null);
      setSession(null);
      localStorage.removeItem('masternote_demo_user_id');
      return;
    }
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    userId: isDemoMode ? demoUserId : (user?.id || null),
    dataMigrated,
    setDataMigrated,
    setDemoUser,
    isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 