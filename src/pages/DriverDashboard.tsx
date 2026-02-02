import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  DollarSign, 
  Star,
  Menu,
  User,
  LogOut,
  Navigation,
  Power,
  Clock,
  X,
  TrendingUp,
  CheckCircle,
  XCircle
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
import type { Ride, Profile } from '@/lib/supabase';

export function DriverDashboard() {
  const { profile, isAuthenticated } = useAuth();
  const { signOut } = useAuthStore();
  const { latitude, longitude } = useGeolocation({ watch: true });
  const { availableRides, setAvailableRides, addAvailableRide, removeAvailableRide, updateAvailableRide } = useRideStore();
  
  const [isOnline, setIsOnline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [counterOffer, setCounterOffer] = useState<number>(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayRides, setTodayRides] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Update driver location and online status
  useEffect(() => {
    if (!profile || !latitude || !longitude) return;

    const updateLocation = async () => {
      await supabase
        .from('profiles')
        .update({
          current_lat: latitude,
          current_lng: longitude,
          is_online: isOnline,
        })
        .eq('id', profile.id);
    };

    updateLocation();
  }, [profile, latitude, longitude, isOnline]);

  // Subscribe to new ride requests when online
  useEffect(() => {
    if (!isOnline || !profile) return;

    // Fetch current pending rides
    const fetchRides = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setAvailableRides(data as Ride[]);
      }
    };

    fetchRides();

    // Subscribe to new rides
    const channel = supabase
      .channel('pending-rides')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: 'status=eq.pending',
        },
        (payload) => {
          const newRide = payload.new as Ride;
          addAvailableRide(newRide);
          
          toast({
            title: '¡Nueva solicitud!',
            description: `Oferta de $${newRide.offer_price}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
        },
        (payload) => {
          const updatedRide = payload.new as Ride;
          
          if (updatedRide.status === 'cancelled' || updatedRide.status === 'accepted') {
            removeAvailableRide(updatedRide.id);
          } else {
            updateAvailableRide(updatedRide);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, profile, setAvailableRides, addAvailableRide, removeAvailableRide, updateAvailableRide, toast]);

  const handleAcceptRide = useCallback(async (ride: Ride) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: profile.id,
          final_price: ride.offer_price,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', ride.id)
        .eq('status', 'pending'); // Ensure ride hasn't been taken

      if (error) throw error;

      removeAvailableRide(ride.id);
      setSelectedRide(null);
      setTodayRides((prev) => prev + 1);
      setTodayEarnings((prev) => prev + ride.offer_price);

      toast({
        title: '¡Viaje aceptado!',
        description: `Ganancia: $${ride.offer_price}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'El viaje ya fue tomado por otro conductor',
        variant: 'destructive',
      });
    }
  }, [profile, removeAvailableRide, toast]);

  const handleCounterOffer = useCallback(async (ride: Ride) => {
    if (!profile || counterOffer <= 0) return;

    try {
      const { error } = await supabase
        .from('bids')
        .insert({
          ride_id: ride.id,
          user_id: profile.id,
          bid_price: counterOffer,
        });

      if (error) throw error;

      // Update ride status to negotiating
      await supabase
        .from('rides')
        .update({ status: 'negotiating' })
        .eq('id', ride.id);

      setSelectedRide(null);
      setCounterOffer(0);

      toast({
        title: 'Contraoferta enviada',
        description: `Ofreciste $${counterOffer}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [profile, counterOffer, toast]);

  const handleLogout = async () => {
    setIsOnline(false);
    await signOut();
    navigate('/');
  };

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
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
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{profile?.full_name || 'Conductor'}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{profile?.rating || 5.0}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4 rounded-xl glass mb-6">
                <div className="text-sm text-muted-foreground mb-2">Mi Vehículo</div>
                <div className="font-medium">{profile?.vehicle_model || 'No registrado'}</div>
                <div className="text-sm text-muted-foreground">{profile?.vehicle_plate || ''}</div>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="w-5 h-5" />
                  Ganancias
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  Historial
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
          <span className="font-display font-bold">Conductor</span>
        </div>

        {/* Online Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            isOnline 
              ? 'bg-primary text-primary-foreground neon-glow' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Power className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isOnline ? 'En Línea' : 'Desconectado'}
          </span>
        </button>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-card/50">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Ganancias Hoy</span>
          </div>
          <div className="text-2xl font-display font-bold text-primary">
            ${todayEarnings}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Navigation className="w-4 h-4" />
            <span className="text-sm">Viajes Hoy</span>
          </div>
          <div className="text-2xl font-display font-bold">
            {todayRides}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!isOnline ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
                <Power className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Estás desconectado</h2>
              <p className="text-muted-foreground mb-6">
                Activa el modo en línea para recibir solicitudes de viaje
              </p>
              <Button 
                variant="neon" 
                size="lg"
                onClick={() => setIsOnline(true)}
              >
                <Power className="w-5 h-5" />
                Conectarse
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-display font-bold">
                Solicitudes Disponibles ({availableRides.length})
              </h2>
            </div>

            {availableRides.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Navigation className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Esperando nuevas solicitudes...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {availableRides.map((ride) => (
                  <motion.div
                    key={ride.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="glass-strong rounded-xl p-4"
                    onClick={() => {
                      setSelectedRide(ride);
                      setCounterOffer(Math.round(ride.offer_price * 1.2));
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm truncate">{ride.origin_address || 'Origen'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full" />
                          <span className="text-sm truncate">{ride.destination_address || 'Destino'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-display font-bold text-primary">
                          ${ride.offer_price}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Oferta del pasajero
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="neon" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRide(ride);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aceptar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRide(ride);
                          setCounterOffer(Math.round(ride.offer_price * 1.2));
                        }}
                      >
                        <DollarSign className="w-4 h-4" />
                        Contraofertar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      <AnimatePresence>
        {selectedRide && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRide(null)}
            />
            <motion.div
              className="fixed left-4 right-4 bottom-4 bg-card rounded-2xl p-6 z-50 border border-border"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-bold">Hacer contraoferta</h3>
                <button onClick={() => setSelectedRide(null)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="glass rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{selectedRide.origin_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">{selectedRide.destination_address}</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-sm text-muted-foreground mb-1">Oferta del pasajero</div>
                <div className="text-2xl font-display font-bold text-muted-foreground line-through">
                  ${selectedRide.offer_price}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Tu contraoferta</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(Number(e.target.value))}
                    className="pl-10 h-14 bg-secondary text-2xl font-display font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedRide(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="neon" 
                  className="flex-1"
                  onClick={() => handleCounterOffer(selectedRide)}
                >
                  Enviar ${counterOffer}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
