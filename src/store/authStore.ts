import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null, isLoading: false });
      return;
    }

    try {
      let retries = 5;
      while (retries > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // maybeSingle doesn't error on 0 results

        if (data) {
          console.log('Profile loaded successfully');
          set({ profile: data as Profile, isLoading: false });
          return;
        }

        if (error && error.code === 'PGRST205') {
          console.error('Critical Database Error: Profiles table missing.');
          break;
        }

        console.log(`Profile not found, waiting for DB trigger... (${retries} left)`);
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err) {
      console.error('Unified Auth Error:', err);
    }

    // If we reach here, we failed to find a profile
    set({ profile: null, isLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
