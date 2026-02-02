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

    let retries = 5;
    while (retries > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        set({ profile: data as Profile, isLoading: false });
        return;
      }

      if (error) {
        // PGRST205 means table doesn't exist. No point in retrying.
        if (error.code === 'PGRST205') {
          console.error('Critical Error: Profiles table missing. Please run SQL migrations.', error);
          break;
        }

        // PGRST116 means profile not found yet (trigger might be running)
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          break;
        }
      }

      console.log(`Profile not found, retrying... (${retries} retries left)`);
      retries--;
      if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
    }

    set({ profile: null, isLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
