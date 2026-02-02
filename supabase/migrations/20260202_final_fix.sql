-- Final Consolidation Migration
-- Fixes: Profile creation with role/phone, Verification status, Performance indexes

-- 1. Ensure user_role enum exists (if not already)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('rider', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure ride_status enum exists
DO $$ BEGIN
    CREATE TYPE public.ride_status AS ENUM ('pending', 'negotiating', 'accepted', 'driver_arriving', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Enhance Profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'suspended')),
ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 4. Update the Trigger Function to handle NEW.raw_user_meta_data correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'rider'::public.user_role),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_rider ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_online ON public.profiles(role, is_online) WHERE role = 'driver';
