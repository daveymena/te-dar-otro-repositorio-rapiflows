import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, profile, isLoading, setUser, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await useAuthStore.getState().fetchProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth event:', event);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN') {
          await useAuthStore.getState().fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.getState().setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

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
