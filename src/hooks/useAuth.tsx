import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'super_admin' | 'accountant' | 'teacher' | 'student' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const currentUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('role', { ascending: true })
      .limit(1);
    
    if (isMountedRef.current) {
      if (data && data.length > 0 && !error) {
        setRole(data[0].role as AppRole);
      } else {
        setRole(null);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return;

        const newUserId = session?.user?.id ?? null;

        // Always update session and user
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          currentUserIdRef.current = null;
          setRole(null);
          return;
        }

        // Only fetch role if the user ID actually changed (new sign-in)
        if (newUserId && newUserId !== currentUserIdRef.current) {
          currentUserIdRef.current = newUserId;
          // Fetch role in background — don't set loading to true
          // The initial load handles the first render's loading state
          fetchUserRole(newUserId);
        }
        // For TOKEN_REFRESHED with same user ID: do nothing — skip role re-fetch
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;

        setSession(session);
        setUser(session?.user ?? null);
        currentUserIdRef.current = session?.user?.id ?? null;

        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } finally {
        if (isMountedRef.current) setInitialLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error };
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    currentUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading: initialLoading, signIn, signUp, signOut }}>
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
