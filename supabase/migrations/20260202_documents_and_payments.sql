-- Migration: Add Documents and Payments tables
-- Author: AntiGravity Agent
-- Date: 2026-02-02

-- 1. Documents Table for Driver Verification
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('license', 'insurance', 'id_card', 'vehicle_photo')),
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Users can upload own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all documents"
    ON public.documents -- Requires admin role check function or simplified logic
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES public.profiles(id),
    payee_id UUID REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'wallet')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider_id TEXT, -- Stripe PaymentIntent ID etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- 3. Ride Waypoints (History/Tracking)
CREATE TABLE IF NOT EXISTS public.ride_waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ride_waypoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view waypoints"
    ON public.ride_waypoints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rides
            WHERE rides.id = ride_waypoints.ride_id
            AND (rides.rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) 
                 OR rides.driver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
        )
    );

-- 4. Enable Realtime for these new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
