import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  DollarSign,
  Send,
  Clock,
  Star,
  Menu,
  User,
  LogOut,
  Car,
  MessageSquare,
  X,
  Loader2,

  CheckCircle,
  Bike,
  Utensils,
  ShoppingBag,
  Package,
  Shield,
  ArrowRight,
  Search,
  Bell,
  Heart,
  Phone,
  Info,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRideStore } from '@/store/rideStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SafetyCenter } from '@/components/SafetyCenter';
import { useNavigate, Navigate } from 'react-router-dom';
import type { Ride, Bid } from '@/lib/supabase';
import MapComponent from '@/components/Map';
import { ChatPanel } from '@/components/ChatPanel';
import { EmergencyButton } from '@/components/EmergencyButton';
import { ETAIndicator } from '@/components/ETAIndicator';
import { DriverCard } from '@/components/DriverCard';
import { RatingModal } from '@/components/RatingModal';
import { ShareRide } from '@/components/ShareRide';
import { FavoritePlaces } from '@/components/FavoritePlaces';
import { FoodPanel } from '@/components/FoodPanel';
import { useRouteTracking } from '@/services/routingService';
import { WalletCard } from '@/components/WalletCard';

// Mock data for demonstration
const mockDrivers = [
  { id: '1', name: 'Carlos M.', rating: 4.9, vehicle: 'Toyota Corolla', eta: 3 },
  { id: '2', name: 'María G.', rating: 4.8, vehicle: 'Honda Civic', eta: 5 },
  { id: '3', name: 'Juan P.', rating: 4.7, vehicle: 'Nissan Sentra', eta: 7 },
];

type RideStep = 'location' | 'price' | 'waiting' | 'negotiating' | 'accepted' | 'on_trip' | 'completed';

export function RiderDashboard() {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const { signOut } = useAuthStore();
  const { latitude, longitude, error: geoError, isLoading: geoLoading } = useGeolocation({ watch: true });
  const {
    origin,
    destination,
    estimatedPrice,
    offerPrice,
    currentRide,
    bids,
    setOrigin,
    setDestination,
    setEstimatedPrice,
    setOfferPrice,
    setCurrentRide,
    setBids,
    addBid,
    resetRideFlow,
    serviceType,
    vehicleType,
    middleStops,
    setServiceType,
    setVehicleType,
    setMiddleStops
  } = useRideStore();

  const [step, setStep] = useState<RideStep>('location');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Route tracking for ETA
  // Prefer real driver position from Supabase, fallback to mock if needed
  const driverPosition = currentRide?.driver_id
    ? (realDrivers.find(d => d.id === currentRide.driver_id) || mockDrivers.find(d => d.id === currentRide.driver_id))
    : null;

  // Dynamic Routing & ETA Context
  // If Driver Arriving: Track Driver -> Pickup
  // If On Trip: Track Driver -> Destination
  const isDriverComing = ['accepted', 'driver_arriving'].includes(currentRide?.status || '');

  const trackingOrigin = isDriverComing && driverPosition
    ? { lat: driverPosition.current_lat || driverPosition.lat || 0, lng: driverPosition.current_lng || driverPosition.lng || 0 } // Driver is "Origin"
    : origin; // User is Origin (On Trip)

  const trackingDestination = isDriverComing
    ? origin // Pickup is "Destination"
    : destination; // Final Dest is Destination

  // NOTE: We pass driverPosition as the 3rd arg to calculate *remaining* distance along the route
  const { route, eta, formattedDistance, formattedEta } = useRouteTracking(
    trackingOrigin,
    trackingDestination,
    driverPosition ? { lat: driverPosition.current_lat || driverPosition.lat || 0, lng: driverPosition.current_lng || driverPosition.lng || 0 } : null
  );

  // Set origin from REAL geolocation automatically on load
  useEffect(() => {
    if (latitude && longitude && !origin && !geoLoading && !hasInitializedLocation) {
      const initLocation = async () => {
        try {
          setHasInitializedLocation(true);
          // Import dynamic to avoid circular dependencies
          const { reverseGeocode } = await import('@/services/routingService');
          const realAddress = await reverseGeocode({ lat: latitude, lng: longitude });

          if (realAddress) {
            console.log('Real address found:', realAddress);
            setOrigin({ lat: latitude, lng: longitude, address: realAddress });
            setOriginInput(realAddress.split(',')[0]); // Use first part of the address

            toast({
              title: "Ubicación detectada",
              description: realAddress.split(',')[0],
            });
          } else {
            // Fallback to simple format if geocoding fails
            const fallback = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            setOrigin({ lat: latitude, lng: longitude, address: fallback });
            setOriginInput(fallback);
          }
        } catch (err) {
          console.error('Error in automatic detection:', err);
        }
      };

      initLocation();
    }
  }, [latitude, longitude, geoLoading, origin, setOrigin, setOriginInput, hasInitializedLocation]);

  // Dynamic Place Search Effect
  useEffect(() => {
    if (destinationInput.length < 3 || destination) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { searchPlaces } = await import('@/services/routingService');
        const results = await searchPlaces(destinationInput,
          latitude && longitude ? { lat: latitude, lng: longitude } : undefined
        );
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [destinationInput, destination, latitude, longitude]);
  useEffect(() => {
    if (origin && destination) {
      // Mock distance calculation with MULTIPLE STOPS support
      const points = [origin, ...middleStops, destination];
      let distance = 0;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (p1 && p2) {
          distance += Math.sqrt(
            Math.pow(p2.lat - p1.lat, 2) +
            Math.pow(p2.lng - p1.lng, 2)
          ) * 111;
        }
      }

      // Lógica de Precios Avanzada (Adaptada a Villa Gorgona/Candelaria vs Cali)
      // Detectar zona basada en la dirección (Simulación)
      const currentAddress = (origin.address || '').toLowerCase();
      const destAddress = (destination.address || '').toLowerCase();

      const isRuralOrTown =
        currentAddress.includes('gorgona') ||
        currentAddress.includes('candelaria') ||
        currentAddress.includes('poblado campestre') ||
        destAddress.includes('gorgona') ||
        destAddress.includes('candelaria');

      const categoryMultipliers = {
        economy: 1.0,
        comfort: 1.4,
        moto: 0.7,
        delivery: 1.2
      };

      // Dinamic Demand Simulator (Surge Pricing)
      // Logic: If in Cali (not rural) and during peak hours or hot zones
      const isHotZone = !isRuralOrTown && (currentAddress.includes('centro') || currentAddress.includes('universidad'));
      const demandMultiplier = isHotZone ? 1.25 : 1.0;

      const multiplier = (categoryMultipliers[vehicleType as keyof typeof categoryMultipliers] || 1.0) * demandMultiplier;
      const isMoto = vehicleType === 'moto';

      // Tarifas Base y Mínimas
      let basePrice = 0;
      let pricePerKm = 0;
      let minFare = 0;

      if (isRuralOrTown) {
        // Tarifas "Pueblo" (Villa Gorgona, Candelaria)
        if (isMoto) {
          basePrice = 2500;
          pricePerKm = 1000;
          minFare = 4000;
        } else {
          // Carro (Economy/Comfort/Delivery)
          basePrice = 4000;
          pricePerKm = 1800;
          minFare = 7000;
        }
      } else {
        // Tarifas Ciudad (Cali)
        if (isMoto) {
          basePrice = 3000;
          pricePerKm = 900;
          minFare = 5000;
        } else {
          // Carro (Economy/Comfort/Delivery)
          basePrice = 4800;
          pricePerKm = 1600;
          minFare = 8000;
        }
      }

      // 🕒 Factor Tiempo (Costo por Minuto)
      const avgSpeedKmH = isMoto ? 33 : 20; // Un poco más lento en ciudad
      const estimatedDurationMinutes = (distance / avgSpeedKmH) * 60;
      const pricePerMinute = isMoto ? 150 : 380;
      const timeCost = estimatedDurationMinutes * pricePerMinute;

      // Cálculo del precio TOTAL con multiplicador
      let rawPrice = (basePrice + (distance * pricePerKm) + timeCost) * multiplier;

      // Aplicar mínima (ajustada por multiplicador)
      const adjustedMinFare = minFare * (multiplier > 1 ? multiplier * 0.9 : multiplier);
      if (rawPrice < adjustedMinFare) rawPrice = adjustedMinFare;

      // Redondear a la centena más cercana
      const estimated = Math.round(rawPrice / 100) * 100;

      setEstimatedPrice(estimated);
      setOfferPrice(estimated);
    }
  }, [origin, destination, middleStops, vehicleType, setEstimatedPrice, setOfferPrice]);

  // Subscribe to ride updates
  useEffect(() => {
    if (!currentRide) return;

    const channel = supabase
      .channel(`ride-${currentRide.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${currentRide.id}`,
        },
        (payload) => {
          const updatedRide = payload.new as Ride;
          setCurrentRide(updatedRide);

          if (updatedRide.status === 'accepted') {
            setStep('accepted');
            toast({ title: '¡Conductor encontrado!', description: 'El conductor va en camino a recogerte' });
          } else if (updatedRide.status === 'driver_arriving') {
            setStep('accepted');
            toast({ title: '¡Conductor llegó!', description: 'Tu transporte está en el punto de encuentro' });
          } else if (updatedRide.status === 'ongoing') {
            setStep('on_trip');
            toast({ title: 'Viaje iniciado', description: 'En camino a tu destino' });
          } else if (updatedRide.status === 'completed') {
            setStep('completed');
            toast({ title: 'Llegaste a tu destino', description: '¡Esperamos que hayas tenido un excelente viaje!' });
          } else if (updatedRide.status === 'cancelled') {
            resetRideFlow();
            setStep('location');
            toast({ title: 'Viaje cancelado', description: 'El viaje ha sido cancelado.', variant: 'destructive' });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `ride_id=eq.${currentRide.id}`,
        },
        (payload) => {
          const newBid = payload.new as Bid;
          addBid(newBid);
          setStep('negotiating');
          toast({
            title: 'Nueva oferta',
            description: `Un conductor ofreció $${newBid.bid_price}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRide, setCurrentRide, addBid, toast]);

  const handleSetDestination = useCallback(() => {
    if (!destinationInput) return;

    // Mock geocoding - in real app, use Mapbox Geocoding API
    setDestination({
      lat: (origin?.lat || 19.4326) + (Math.random() - 0.5) * 0.1,
      lng: (origin?.lng || -99.1332) + (Math.random() - 0.5) * 0.1,
      address: destinationInput,
    });
    setStep('price');
  }, [destinationInput, origin, setDestination]);

  const handleRequestRide = useCallback(async () => {
    if (!profile || !origin || !destination || offerPrice <= 0) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('rides')
        .insert({
          rider_id: profile.id,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          origin_address: origin.address,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          destination_address: destination.address,
          offer_price: offerPrice,
          status: 'pending',
          vehicle_type: vehicleType, // Add vehicle type to ride request
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentRide(data as Ride);
      setStep('waiting');

      toast({
        title: '¡Solicitud enviada!',
        description: 'Buscando conductores cercanos...',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el viaje',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [profile, origin, destination, offerPrice, setCurrentRide, toast]);

  const handleAcceptBid = useCallback(async (bid: Bid) => {
    if (!currentRide) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: bid.user_id,
          final_price: bid.bid_price,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', currentRide.id);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [currentRide, toast]);

  const handleCancelRide = useCallback(async () => {
    if (!currentRide) return;

    try {
      await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', currentRide.id);

      resetRideFlow();
      setStep('location');

      toast({
        title: 'Viaje cancelado',
        description: 'Tu solicitud ha sido cancelada.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [currentRide, resetRideFlow, toast]);

  const handleLogout = async () => {
    // Clean up local state
    resetRideFlow();
    // Sign out from Supabase & Store
    await signOut();
    // Force navigate and reload to guarantee clean slate
    navigate('/', { replace: true });
    window.location.reload();
  };

  const [realDrivers, setRealDrivers] = useState<any[]>([]);

  // Fetch and subscribe to online drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, current_lat, current_lng')
        .eq('role', 'driver')
        .eq('is_online', true);

      if (data) setRealDrivers(data);
    };

    fetchDrivers();

    const channel = supabase
      .channel('online-drivers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.driver'
        },
        () => fetchDrivers() // Simpler to refetch for now
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  // Main Content
  return (
    <div className="h-screen flex bg-background overflow-hidden layout-fix">
      {/* Sidebar - Remains desktop friendly */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 p-6"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-display font-bold">Rapi<span className="text-primary neon-text">carm</span></span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{profile?.full_name || 'Usuario'}</div>
                  <div className="text-sm text-muted-foreground">Pasajero</div>
                </div>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary">
                  <Navigation className="w-5 h-5" />
                  Mis Viajes
                </button>

                {/* Visual Wallet context in sidebar */}
                <div className="py-2">
                  <WalletCard
                    balance={75000}
                    userName={profile?.full_name || 'Usuario'}
                  />
                </div>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-muted-foreground">
                  <Star className="w-5 h-5" />
                  Favoritos
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-muted-foreground text-left"
                >
                  <User className="w-5 h-5" />
                  Mi Perfil
                </button>
              </nav>

              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">Servicios</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setServiceType('ride')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border ${serviceType === 'ride' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'}`}
                  >
                    <Car className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Viajes</span>
                  </button>
                  <button
                    onClick={() => setServiceType('food')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border ${serviceType === 'food' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'}`}
                  >
                    <Utensils className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Comida</span>
                  </button>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/50">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold">Rapi<span className="text-primary neon-text">carm</span></span>
          </div>
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </header>

        {/* Map Area */}
        <div className="flex-1 relative bg-secondary">
          {serviceType === 'food' ? (
            <div className="absolute inset-0 bg-background z-10">
              <FoodPanel />
            </div>
          ) : (
            <MapComponent
              // Dynamic Routing Logic:
              // 1. If Driver Accepted/Arriving: Route from Driver -> Pickup (User Origin)
              // 2. If On Trip: Route from Pickup -> Destination
              // 3. Else (Planning): Route from Pickup -> Destination
              origin={
                ['accepted', 'driver_arriving'].includes(currentRide?.status || '') && driverPosition
                  ? driverPosition // Punto A: Driver
                  : origin // Punto A: Usuario/Pickup
              }
              destination={
                ['accepted', 'driver_arriving'].includes(currentRide?.status || '')
                  ? origin // Punto B: Pickup
                  : destination // Punto B: Destino Final
              }
              middleStops={middleStops}
              assignedDriver={currentRide?.driver_id ? realDrivers.find(d => d.id === currentRide.driver_id) : null}
              drivers={realDrivers.map(d => ({
                id: d.id,
                lat: d.current_lat || 0,
                lng: d.current_lng || 0,
                rotation: Math.random() * 360
              }))}
              demandPoints={[
                { lat: 3.4516, lng: -76.5320, intensity: 0.8 }, // Cali Centro
                { lat: 3.3768, lng: -76.5312, intensity: 0.6 }, // Unicentro
                { lat: 3.4716, lng: -76.5220, intensity: 0.4 }, // Chipichape
                { lat: 3.4216, lng: -76.5120, intensity: 0.7 }, // Calle 5ta
              ]}
              onMapClick={async (lat, lng) => {
                if (step === 'location' || step === 'price') {
                  console.log('Map clicked:', { lat, lng });
                  try {
                    const { reverseGeocode } = await import('@/services/routingService');
                    const address = await reverseGeocode({ lat, lng });
                    if (address) {
                      setDestination({ lat, lng, address });
                      setDestinationInput(address.split(',')[0]);
                    } else {
                      setDestination({ lat, lng, address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
                    }
                  } catch (err) {
                    console.error('Error on map click geocoding:', err);
                  }
                }
              }}
            />
          )}

          {/* Current location indicator */}
          {!origin && latitude && longitude && serviceType === 'ride' && (
            <div className="absolute top-4 left-4 glass rounded-lg p-3 flex items-center gap-2 pointer-events-none">
              <div className="w-3 h-3 bg-primary rounded-full pulse-online" />
              <span className="text-sm">Tu ubicación detectada</span>
            </div>
          )}
        </div>

        {/* Bottom Panel - Android Style Bottom Sheet for Mobile */}
        {serviceType === 'ride' && (
          <motion.div
            className="bg-card border-t border-border rounded-t-3xl p-4 sm:p-6 space-y-4 shadow-2xl relative z-20 max-h-[80vh] overflow-y-auto layout-fix"
            layout
          >
            {/* Visual Drag Indicator for Mobile */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2 sm:hidden opacity-50" />

            <AnimatePresence mode="wait">
              {/* Step 1: Location Input */}
              {step === 'location' && (
                <motion.div
                  key="location"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-display font-bold">¿A dónde vamos?</h2>

                  {/* Professional Vehicle Categories Selector - Uber/Didi Style */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Selecciona tu categoría</span>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                      {[
                        { id: 'economy', name: 'Ahorro', icon: Car, desc: 'Económico', price: 'x1.0' },
                        { id: 'comfort', name: 'Comfort', icon: Shield, desc: 'Premium', price: 'x1.4' },
                        { id: 'moto', name: 'Moto', icon: Bike, desc: 'Rápido', price: 'x0.6' },
                        { id: 'delivery', name: 'Envío', icon: Package, desc: 'Paquetes', price: 'Fixed' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setVehicleType(type.id as any)}
                          className={`flex-shrink-0 w-24 snap-start p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${vehicleType === type.id
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border bg-card hover:border-muted-foreground/30'
                            }`}
                        >
                          <div className={`p-2 rounded-xl ${vehicleType === type.id ? 'bg-primary text-black' : 'bg-secondary text-muted-foreground'}`}>
                            <type.icon className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <div className={`text-[11px] font-black uppercase ${vehicleType === type.id ? 'text-primary' : 'text-foreground'}`}>{type.name}</div>
                            <div className="text-[9px] text-muted-foreground font-medium">{type.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
                      <Input
                        placeholder="Tu ubicación"
                        value={originInput}
                        onChange={(e) => setOriginInput(e.target.value)}
                        className="pl-10 h-14 bg-secondary"
                        readOnly
                      />
                    </div>

                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      </div>
                      <Input
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        placeholder="¿A dónde vas?"
                        className="pl-10 h-14 bg-secondary/50 border-border rounded-xl text-base focus:ring-accent/50"
                      />
                      {/* Plus button for multiple stops */}
                      <button
                        onClick={() => {
                          if (destination && !middleStops.find(s => s.address === destination.address)) {
                            setMiddleStops([...middleStops, destination]);
                            setDestinationInput('');
                            setDestination(null);
                            toast({ title: "Parada añadida", description: "Puedes agregar otra parada o el destino final." });
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent/20 hover:bg-accent/40 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-5 h-5 text-accent" />
                      </button>
                    </div>

                    {/* Show added stops */}
                    {middleStops.length > 0 && (
                      <div className="space-y-2 ml-4 border-l-2 border-dashed border-border pl-4 py-2">
                        {middleStops.map((stop, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </div>
                              <span className="text-xs truncate text-muted-foreground italic">{stop.address}</span>
                            </div>
                            <button
                              onClick={() => setMiddleStops(middleStops.filter((_, i) => i !== idx))}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Autocomplete Suggestions - Multi-branch support */}
                    {searchResults.length > 0 && !destination && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                        {isSearching && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Buscando sedes cercanas...
                          </div>
                        )}
                        {searchResults.map((place, idx) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary text-left transition-colors border-b border-border/50 last:border-0"
                            onClick={() => {
                              setDestinationInput(place.name);
                              setDestination({
                                lat: place.lat,
                                lng: place.lng,
                                address: place.address
                              });
                              setSearchResults([]);
                            }}
                          >
                            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-accent" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-sm truncate">{place.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{place.address}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Favorite Places */}
                  {profile && (
                    <div className="mt-6">
                      <FavoritePlaces
                        userId={profile.id}
                        onSelectPlace={(place) => {
                          setDestination({
                            lat: place.lat,
                            lng: place.lng,
                            address: place.address,
                          });
                          setDestinationInput(place.address);
                        }}
                      />
                    </div>
                  )}

                  <Button
                    variant="neon"
                    size="lg"
                    className="w-full"
                    onClick={handleSetDestination}
                    disabled={!destinationInput}
                  >
                    Confirmar destino
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Price Offer */}
              {step === 'price' && (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-display font-bold">Tu oferta</h2>
                    <button
                      onClick={() => setStep('location')}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cambiar destino
                    </button>
                  </div>

                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="text-sm text-muted-foreground truncate">
                        {origin?.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <span className="text-sm text-muted-foreground truncate">
                        {destination?.address}
                      </span>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground mb-2">Precio estimado</div>
                    <div className="text-3xl font-display font-bold text-primary neon-text">
                      {(estimatedPrice || 0).toLocaleString('es-CO')} COP
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      ¿Cuánto quieres ofrecer?
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="number"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(Number(e.target.value))}
                        className="pl-10 h-14 bg-secondary text-2xl font-display font-bold text-center"
                      />
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                      {[
                        (Math.round((estimatedPrice! * 0.9) / 100) * 100),
                        estimatedPrice!,
                        (Math.round((estimatedPrice! * 1.1) / 100) * 100)
                      ].map((price) => (
                        <button
                          key={price}
                          onClick={() => setOfferPrice(price)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${offerPrice === price
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-muted'
                            }`}
                        >
                          ${(price || 0).toLocaleString('es-CO')}
                        </button>
                      ))}
                    </div>

                    {/* Vehicle Info */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-secondary/50 py-2 rounded-lg">
                      {['economy', 'comfort'].includes(vehicleType) ? <Car className="w-4 h-4" /> : vehicleType === 'moto' ? <Bike className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      <span className="capitalize">Categoría: {vehicleType === 'economy' ? 'RapiAhorro' : vehicleType === 'comfort' ? 'RapiComfort' : vehicleType === 'moto' ? 'RapiMoto' : 'RapiEnvío'}</span>
                    </div>
                  </div>


                  <Button
                    variant="neon"
                    size="lg"
                    className="w-full"
                    onClick={handleRequestRide}
                    disabled={isSubmitting || offerPrice <= 0}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar solicitud por ${(offerPrice || 0).toLocaleString('es-CO')}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Waiting for drivers */}
              {/* Step 3: Waiting */}
              {step === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6 text-center"
                >
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-4 bg-primary/30 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <div className="relative w-full h-full bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(155,135,245,0.5)]">
                      <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">Buscando conductores...</h2>
                    <p className="text-muted-foreground px-4">
                      Tu oferta de <span className="text-primary font-bold text-lg">${offerPrice.toLocaleString('es-CO')}</span> está llegando a los conductores cercanos.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelRide}
                      className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-all font-medium"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar solicitud
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Negotiating */}
              {step === 'negotiating' && (
                <motion.div
                  key="negotiating"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-display font-bold">Ofertas de conductores</h2>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="glass rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-medium">Conductor</div>
                            <div className="text-2xl font-display font-bold text-primary">
                              ${bid.bid_price.toLocaleString('es-CO')}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="neon"
                          size="sm"
                          onClick={() => handleAcceptBid(bid)}
                        >
                          Aceptar
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleCancelRide}
                    className="w-full"
                  >
                    Cancelar solicitud
                  </Button>
                </motion.div>
              )}

              {/* Step 5: Accepted */}
              {step === 'accepted' && (
                <motion.div
                  key="accepted"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 text-center"
                >
                  <div className={`w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center neon-glow ${currentRide?.status === 'driver_arriving' ? 'animate-pulse' : ''}`}>
                    <Car className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-display font-bold">
                    {currentRide?.status === 'driver_arriving' ? '¡Tu conductor ha llegado!' : '¡Conductor en camino!'}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentRide?.status === 'driver_arriving'
                      ? 'El conductor está esperando en el punto de encuentro.'
                      : 'Un conductor ha aceptado tu oferta y se dirige hacia ti.'}
                  </p>

                  {/* ETA Indicator */}
                  {eta && (
                    <ETAIndicator
                      eta={eta}
                      distance={formattedDistance}
                      status={currentRide?.status === 'driver_arriving' ? 'arriving' : 'arriving'}
                      className="mb-4"
                    />
                  )}

                  {/* Professional Driver Card */}
                  <DriverCard
                    driverName="Tu Conductor"
                    rating={4.9}
                    totalRides={150}
                    vehicleModel="Toyota Corolla 2022"
                    vehiclePlate="ABC-123"
                    vehicleColor="Gris"
                    isVerified={true}
                    onMessageClick={() => setIsChatOpen(true)}
                    onCallClick={() => toast({ title: 'Llamando...', description: 'Función de llamada en desarrollo' })}
                  />

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      className="rounded-xl border-primary/50 hover:bg-primary/10"
                      onClick={() => setIsShareOpen(true)}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Compartir Viaje
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      onClick={handleCancelRide}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 6: On Trip */}
              {(step === 'on_trip') && (
                <motion.div
                  key="on_trip"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 text-center"
                >
                  <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Car className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold">En camino a tu destino</h2>
                  <p className="text-muted-foreground">
                    {destination?.address}
                  </p>

                  {/* ETA Indicator for ongoing trip */}
                  {eta && (
                    <ETAIndicator
                      eta={eta}
                      distance={formattedDistance}
                      status="ongoing"
                      className="mb-4"
                    />
                  )}

                  {/* Driver Card */}
                  <DriverCard
                    driverName="Tu Conductor"
                    rating={4.9}
                    totalRides={150}
                    vehicleModel="Toyota Corolla 2022"
                    vehiclePlate="ABC-123"
                    vehicleColor="Gris"
                    isVerified={true}
                    onMessageClick={() => setIsChatOpen(true)}
                    onCallClick={() => toast({ title: 'Llamando...', description: 'Función de llamada en desarrollo' })}
                  />

                  <div className="mt-4 p-4 glass rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Precio Final</span>
                      <span className="font-bold text-2xl text-primary">${currentRide?.final_price}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 7: Completed */}
              {step === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-2">¡Llegaste!</h2>
                    <p className="text-muted-foreground">Tu viaje ha finalizado con éxito.</p>
                  </div>

                  <div className="glass-strong p-6 rounded-2xl">
                    <div className="text-sm text-muted-foreground mb-1">Total a pagar</div>
                    <div className="text-4xl font-display font-bold text-primary mb-4">
                      ${(currentRide?.final_price || 0).toLocaleString('es-CO')}
                    </div>

                    {/* Detalles del Costo (Lógica Transparente) */}
                    <div className="space-y-2 mb-4 text-xs border-t border-border/50 pt-2">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Tarifa Conductor</span>
                        <span>${(Math.round((currentRide?.final_price || 0) * 0.9)).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between items-center text-primary/80">
                        <span>Tarifa de Servicio (App)</span>
                        <span>${(Math.round((currentRide?.final_price || 0) * 0.1)).toLocaleString('es-CO')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm bg-secondary py-2 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                      <span>Pago en efectivo</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="neon"
                      size="lg"
                      className="w-full rounded-xl"
                      onClick={() => setIsRatingOpen(true)}
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Calificar Conductor
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full rounded-xl"
                      onClick={() => {
                        resetRideFlow();
                        setStep('location');
                        setDestinationInput('');
                      }}
                    >
                      Solicitar Otro Viaje
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Components */}
      {currentRide && profile && origin && (
        <>
          <EmergencyButton
            rideId={currentRide.id}
            userId={profile.id}
            currentLocation={origin}
          />

          <ChatPanel
            rideId={currentRide.id}
            currentUserId={profile.id}
            otherUserName="Conductor"
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />

          <ShareRide
            rideId={currentRide.id}
            userId={profile.id}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
          />

          {currentRide.driver_id && (
            <RatingModal
              isOpen={isRatingOpen}
              rideId={currentRide.id}
              driverId={currentRide.driver_id}
              driverName="Tu Conductor"
              onClose={() => setIsRatingOpen(false)}
              onComplete={() => {
                resetRideFlow();
                setStep('location');
              }}
            />
          )}
        </>
      )}

      <SafetyCenter
        rideId={currentRide?.id}
        driverId={currentRide?.driver_id}
        onShare={() => setIsShareOpen(true)}
        onSOS={() => {
          const sosButton = document.getElementById('sos-trigger-btn');
          if (sosButton) sosButton.click();
        }}
      />
    </div>
  );
}
