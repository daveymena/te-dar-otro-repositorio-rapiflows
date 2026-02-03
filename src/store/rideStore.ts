import { create } from 'zustand';
import type { Ride, Bid } from '@/lib/supabase';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RideState {
  // Current ride request flow
  origin: Location | null;
  destination: Location | null;
  middleStops: Location[]; // Professional feature: Multiple stops
  estimatedPrice: number | null;
  offerPrice: number;
  currentRide: Ride | null;
  bids: Bid[];

  // Available rides for drivers
  availableRides: Ride[];

  serviceType: 'ride' | 'food';
  vehicleType: 'economy' | 'comfort' | 'moto' | 'delivery'; // Professional categories like Uber/Didi

  // Actions
  setServiceType: (type: 'ride' | 'food') => void;
  setVehicleType: (type: 'economy' | 'comfort' | 'moto' | 'delivery') => void;
  setOrigin: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  setMiddleStops: (stops: Location[]) => void;
  setEstimatedPrice: (price: number | null) => void;
  setOfferPrice: (price: number) => void;
  setCurrentRide: (ride: Ride | null) => void;
  setBids: (bids: Bid[]) => void;
  addBid: (bid: Bid) => void;
  setAvailableRides: (rides: Ride[]) => void;
  addAvailableRide: (ride: Ride) => void;
  updateAvailableRide: (ride: Ride) => void;
  removeAvailableRide: (rideId: string) => void;
  resetRideFlow: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  origin: null,
  destination: null,
  estimatedPrice: null,
  offerPrice: 0,
  currentRide: null,
  bids: [],
  availableRides: [],
  middleStops: [],
  serviceType: 'ride',
  vehicleType: 'economy',

  setServiceType: (serviceType) => set({ serviceType }),
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setMiddleStops: (middleStops) => set({ middleStops }),
  setEstimatedPrice: (estimatedPrice) => set({ estimatedPrice }),
  setOfferPrice: (offerPrice) => set({ offerPrice }),
  setCurrentRide: (currentRide) => set({ currentRide }),
  setBids: (bids) => set({ bids }),
  addBid: (bid) => set((state) => ({ bids: [...state.bids, bid] })),
  setAvailableRides: (availableRides) => set({ availableRides }),
  addAvailableRide: (ride) => set((state) => ({
    availableRides: [ride, ...state.availableRides]
  })),
  updateAvailableRide: (ride) => set((state) => ({
    availableRides: state.availableRides.map((r) =>
      r.id === ride.id ? ride : r
    ),
  })),
  removeAvailableRide: (rideId) => set((state) => ({
    availableRides: state.availableRides.filter((r) => r.id !== rideId),
  })),
  resetRideFlow: () => set({
    origin: null,
    destination: null,
    estimatedPrice: null,
    offerPrice: 0,
    currentRide: null,
    bids: [],
    middleStops: [],
    // Keep vehicleType and serviceType persistent or reset them if desired
  }),
}));
