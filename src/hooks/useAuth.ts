import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, profile, isLoading, setUser, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => {
            fetchProfile();
          }, 0);
        } else {
          useAuthStore.getState().setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, fetchProfile]);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isDriver: profile?.role === 'driver',
    isRider: profile?.role === 'rider',
    isAdmin: profile?.role === 'admin',
  };
}
