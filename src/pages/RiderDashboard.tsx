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
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRideStore } from '@/store/rideStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { useRouteTracking } from '@/services/routingService';

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
    resetRideFlow
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

  const { toast } = useToast();
  const navigate = useNavigate();

  // Route tracking for ETA
  const driverPosition = currentRide?.driver_id && mockDrivers.find(d => d.id === currentRide.driver_id)
    ? { lat: (mockDrivers.find(d => d.id === currentRide.driver_id) as any).current_lat || 0, lng: (mockDrivers.find(d => d.id === currentRide.driver_id) as any).current_lng || 0 }
    : null;

  const { route, eta, formattedDistance, formattedEta } = useRouteTracking(
    origin,
    destination,
    driverPosition
  );

  // Set origin from geolocation
  useEffect(() => {
    if (latitude && longitude && !origin) {
      setOrigin({ lat: latitude, lng: longitude, address: 'Tu ubicación actual' });
      setOriginInput('Tu ubicación actual');
    }
  }, [latitude, longitude, origin, setOrigin]);

  // Calculate estimated price when destination is set
  useEffect(() => {
    if (origin && destination) {
      // Mock distance calculation (in real app, use Mapbox Directions API)
      const distance = Math.sqrt(
        Math.pow(destination.lat - origin.lat, 2) +
        Math.pow(destination.lng - origin.lng, 2)
      ) * 111; // Rough km conversion

      const basePrice = 25;
      const pricePerKm = 8;
      const estimated = Math.round(basePrice + (distance * pricePerKm));
      setEstimatedPrice(estimated);
      setOfferPrice(estimated);
    }
  }, [origin, destination, setEstimatedPrice, setOfferPrice]);

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
    await signOut();
    navigate('/');
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
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
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
                  <span className="text-xl font-display font-bold">AntiGravity</span>
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">AntiGravity</span>
          </div>
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </header>

        {/* Map Area */}
        <div className="flex-1 relative bg-secondary">
          <MapComponent
            origin={origin}
            destination={destination}
            assignedDriver={currentRide?.driver_id ? realDrivers.find(d => d.id === currentRide.driver_id) : null}
            drivers={realDrivers.map(d => ({
              id: d.id,
              lat: d.current_lat || 0,
              lng: d.current_lng || 0,
              rotation: Math.random() * 360
            }))}
          />

          {/* Current location indicator */}
          {!origin && latitude && longitude && (
            <div className="absolute top-4 left-4 glass rounded-lg p-3 flex items-center gap-2 pointer-events-none">
              <div className="w-3 h-3 bg-primary rounded-full pulse-online" />
              <span className="text-sm">Tu ubicación detectada</span>
            </div>
          )}
        </div>

        {/* Bottom Sheet */}
        <motion.div
          className="bg-card border-t border-border rounded-t-3xl p-6 space-y-4"
          layout
        >
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

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full" />
                    <Input
                      placeholder="¿A dónde vas?"
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      className="pl-10 h-14 bg-secondary"
                      autoFocus
                    />
                  </div>
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
                    ${estimatedPrice}
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
                    {[estimatedPrice! - 10, estimatedPrice!, estimatedPrice! + 10].map((price) => (
                      <button
                        key={price}
                        onClick={() => setOfferPrice(price)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${offerPrice === price
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-muted'
                          }`}
                      >
                        ${price}
                      </button>
                    ))}
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
                      Enviar solicitud por ${offerPrice}
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Waiting for drivers */}
            {step === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 text-center"
              >
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-display font-bold">Buscando conductores...</h2>
                <p className="text-muted-foreground">
                  Tu oferta de <span className="text-primary font-bold">${offerPrice}</span> ha sido enviada
                </p>
                <Button
                  variant="outline"
                  onClick={handleCancelRide}
                  className="mt-4"
                >
                  Cancelar solicitud
                </Button>
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
                            ${bid.bid_price}
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
                    ${currentRide?.final_price}
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
    </div>
  );
}
