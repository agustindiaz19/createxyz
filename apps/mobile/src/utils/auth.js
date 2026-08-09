import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

// Authentication context
const AuthContext = createContext({});

// Hook to use authentication
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Function to sign in
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Function to sign up
  const signUp = async (email, password, role = 'citizen') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });
    return { data, error };
  };

  // Function to sign out
  const signOut = async () => {
    try {
      // Clear AsyncStorage directly (working method)
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('supabase.auth.token');
      await AsyncStorage.removeItem('sb-sytreukzybnvzerrfawz-auth-token');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Try Supabase signOut (optional, we already cleared storage)
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        // Ignore Supabase errors since we cleared storage directly
        console.log('Supabase signOut error (ignored):', supabaseError);
      }
      
      // Force session verification to ensure state updates
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }, 100);
      
      return { error: null };
    } catch (err) {
      console.error('Error in signOut:', err);
      return { error: err };
    }
  };

  // Function to reset password
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'recipunto://reset-password',
    });
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
