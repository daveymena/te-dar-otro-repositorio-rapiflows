-- Emergency System Tables
CREATE TABLE IF NOT EXISTS public.emergency_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat Messages Table (for in-app communication)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ride Sharing Links Table
CREATE TABLE IF NOT EXISTS public.ride_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'cash', 'wallet')),
  card_last4 TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  tip_amount NUMERIC DEFAULT 0,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Favorite Places Table
CREATE TABLE IF NOT EXISTS public.favorite_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  icon TEXT DEFAULT 'home',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scheduled Rides Table
CREATE TABLE IF NOT EXISTS public.scheduled_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  origin_lat NUMERIC NOT NULL,
  origin_lng NUMERIC NOT NULL,
  origin_address TEXT NOT NULL,
  destination_lat NUMERIC NOT NULL,
  destination_lng NUMERIC NOT NULL,
  destination_address TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  offer_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_rides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Emergency Logs
DROP POLICY IF EXISTS "Users can view their own emergency logs" ON public.emergency_logs;
CREATE POLICY "Users can view their own emergency logs" ON public.emergency_logs 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create emergency logs" ON public.emergency_logs;
CREATE POLICY "Users can create emergency logs" ON public.emergency_logs 
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for Emergency Contacts
DROP POLICY IF EXISTS "Users can manage their emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can manage their emergency contacts" ON public.emergency_contacts 
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for Chat Messages
DROP POLICY IF EXISTS "Users can view messages from their rides" ON public.chat_messages;
CREATE POLICY "Users can view messages from their rides" ON public.chat_messages 
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE id = ride_id AND (rider_id = auth.uid() OR driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their rides" ON public.chat_messages;
CREATE POLICY "Users can send messages in their rides" ON public.chat_messages 
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- RLS Policies for Ride Shares
DROP POLICY IF EXISTS "Anyone can view active ride shares" ON public.ride_shares;
CREATE POLICY "Anyone can view active ride shares" ON public.ride_shares 
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users can create ride shares" ON public.ride_shares;
CREATE POLICY "Users can create ride shares" ON public.ride_shares 
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- RLS Policies for Payment Methods
DROP POLICY IF EXISTS "Users can manage their payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage their payment methods" ON public.payment_methods 
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for Transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
CREATE POLICY "Users can view their transactions" ON public.transactions 
  FOR SELECT TO authenticated USING (payer_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions" ON public.transactions 
  FOR INSERT TO authenticated WITH CHECK (payer_id = auth.uid());

-- RLS Policies for Favorite Places
DROP POLICY IF EXISTS "Users can manage their favorite places" ON public.favorite_places;
CREATE POLICY "Users can manage their favorite places" ON public.favorite_places 
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for Scheduled Rides
DROP POLICY IF EXISTS "Users can manage their scheduled rides" ON public.scheduled_rides;
CREATE POLICY "Users can manage their scheduled rides" ON public.scheduled_rides 
  FOR ALL TO authenticated USING (rider_id = auth.uid());

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Add emergency status to rides enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'ride_status' AND e.enumlabel = 'emergency'
  ) THEN
    ALTER TYPE ride_status ADD VALUE 'emergency';
  END IF;
END $$;

-- Add new columns to profiles for enhanced features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verification_status TEXT DEFAULT 'unverified' CHECK (id_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'not_started' CHECK (background_check_status IN ('not_started', 'in_progress', 'passed', 'failed'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_ride_id ON public.chat_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_ride_id ON public.emergency_logs(ride_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_status ON public.emergency_logs(status);
CREATE INDEX IF NOT EXISTS idx_transactions_ride_id ON public.transactions(ride_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_scheduled_time ON public.scheduled_rides(scheduled_time);
