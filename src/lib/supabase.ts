import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'rider' | 'driver' | 'admin';
  phone: string | null;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  vehicle_color: string | null;
  rating: number;
  total_rides: number;
  created_at: string;
};

export type RideStatus = 'pending' | 'negotiating' | 'accepted' | 'driver_arriving' | 'ongoing' | 'completed' | 'cancelled';

export type Ride = {
  id: string;
  rider_id: string | null;
  driver_id: string | null;
  origin_lat: number;
  origin_lng: number;
  origin_address: string | null;
  destination_lat: number;
  destination_lng: number;
  destination_address: string | null;
  offer_price: number;
  final_price: number | null;
  status: RideStatus;
  distance_meters: number | null;
  duration_seconds: number | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
};

export type Bid = {
  id: string;
  ride_id: string;
  user_id: string;
  bid_price: number;
  message: string | null;
  created_at: string;
};
