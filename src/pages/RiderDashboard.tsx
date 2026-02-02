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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRideStore } from '@/store/rideStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Ride, Bid } from '@/lib/supabase';

// Mock data for demonstration
const mockDrivers = [
  { id: '1', name: 'Carlos M.', rating: 4.9, vehicle: 'Toyota Corolla', eta: 3 },
  { id: '2', name: 'María G.', rating: 4.8, vehicle: 'Honda Civic', eta: 5 },
  { id: '3', name: 'Juan P.', rating: 4.7, vehicle: 'Nissan Sentra', eta: 7 },
];

type RideStep = 'location' | 'price' | 'waiting' | 'negotiating' | 'accepted';

export function RiderDashboard() {
  const { profile, isAuthenticated } = useAuth();
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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
            toast({
              title: '¡Conductor encontrado!',
              description: 'Tu viaje ha sido aceptado.',
            });
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

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

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
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-muted-foreground">
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

        {/* Map Area (Placeholder) */}
        <div className="flex-1 relative bg-secondary">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-lg">Mapa interactivo</p>
              <p className="text-sm">Configura tu token de Mapbox para ver el mapa</p>
            </div>
          </div>
          
          {/* Current location indicator */}
          {latitude && longitude && (
            <div className="absolute top-4 left-4 glass rounded-lg p-3 flex items-center gap-2">
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          offerPrice === price
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
                <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center neon-glow">
                  <Car className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-display font-bold">¡Conductor en camino!</h2>
                <p className="text-muted-foreground">
                  Precio final: <span className="text-primary font-bold">${currentRide?.final_price}</span>
                </p>
                
                <div className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Tu conductor</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <Button variant="outline" size="icon">
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>Llegando en ~5 min</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
