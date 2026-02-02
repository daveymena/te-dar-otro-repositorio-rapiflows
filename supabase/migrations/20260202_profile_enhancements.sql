-- Add verification and driver details to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'suspended')),
ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Index for searching drivers
CREATE INDEX IF NOT EXISTS idx_profiles_role_online ON public.profiles(role, is_online) WHERE role = 'driver';
