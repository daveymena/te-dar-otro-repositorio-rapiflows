# AntiGravity Ride-Hailing App Implementation Plan

This document outlines the roadmap to transform the current prototype into a complete, production-ready ride-hailing application similar to InDriver or Uber.

## 1. Core Architecture
- **Frontend**: React + Vite + TypeScript (Current)
- **Backend & Database**: Supabase (PostgreSQL + PostGIS + Realtime) (Current)
- **Maps**: Mapbox GL JS (To Be Implemented)
- **State Management**: Zustand (Current)

## 2. Missing "Real World" Features (To Be Built)

### A. Backend (Supabase)
1.  **Driver Verification Schema**:
    -   Add `documents` table (license, insurance, ID photo).
    -   Add `verification_status` to `profiles`.
2.  **Payment Processing**:
    -   Add `payments` table.
    -   Integrate Stripe or local payment gateway (initially simulate with "Cash" vs "Wallet").
3.  **Ride History & Tracking**:
    -   Add `ride_waypoints` table to store route history (lat/lng timestamps).
4.  **Admin Role**:
    -   Policies to allow 'admin' role to approve drivers and view all rides.

### B. Frontend / Mobile App
1.  **Interactive Map Integration**:
    -   Replace placeholders with `react-map-gl`.
    -   Show live driver positions.
    -   Draw route lines (polylines) between origin and destination.
2.  **Driver Onboarding Flow**:
    -   Upload ID/License.
    -   Wait for approval screen.
3.  **Ride Completion Flow**:
    -   "Arrived" state.
    -   "Ride Started" -> Live tracking.
    -   "Ride Completed" -> Payment Summary -> Rating.
4.  **Settings & Profile**:
    -   Edit profile.
    -   Vehicle details management (for drivers).

## 3. Detailed Schema Updates Needed

```sql
-- Driver Documents
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    type TEXT NOT NULL, -- 'license', 'insurance', 'id_card'
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id) NOT NULL,
    amount NUMERIC NOT NULL,
    method TEXT, -- 'cash', 'card', 'wallet'
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 4. Next Steps for "AntiGravity Agent"
1.  **Implement Map**: Create a reusable Map component and integrate it into Rider/Driver dashboards.
2.  **Update Database**: Apply the new schema validation for drivers.
3.  **Complete the Flow**: Connect the "Accepted" state to "Completed" state with a proper UI.
