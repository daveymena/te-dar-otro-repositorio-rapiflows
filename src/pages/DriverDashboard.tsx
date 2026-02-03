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
  Shield,
  Zap,
  Clock3,
  BarChart3,
  Wallet
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
import type { Ride } from '@/lib/supabase';
import MapComponent from '@/components/Map';
import { ChatPanel } from '@/components/ChatPanel';
import { EmergencyButton } from '@/components/EmergencyButton';
import { ETAIndicator } from '@/components/ETAIndicator';
import { useDriverTracking } from '@/hooks/useDriverTracking';
import { useRouteTracking } from '@/services/routingService';

export function DriverDashboard() {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const { signOut } = useAuthStore();
  const { latitude, longitude } = useGeolocation({ watch: true });
  const { availableRides, setAvailableRides, addAvailableRide, removeAvailableRide, updateAvailableRide } = useRideStore();

  const [isOnline, setIsOnline] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [counterOffer, setCounterOffer] = useState<number>(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayRides, setTodayRides] = useState(0);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [riderName, setRiderName] = useState('Pasajero');

  const { toast } = useToast();
  const navigate = useNavigate();

  // GPS Tracking for driver
  const { position: driverPosition, isTracking } = useDriverTracking({
    enabled: isOnline && !!profile,
    updateInterval: 5000,
    onLocationUpdate: async (pos) => {
      // Update driver location in database
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            current_lat: pos.latitude,
            current_lng: pos.longitude,
            last_location_update: new Date().toISOString(),
          })
          .eq('id', profile.id);
      }
    },
  });

  // Route tracking for active ride
  const origin = activeRide && driverPosition
    ? { lat: driverPosition.latitude, lng: driverPosition.longitude }
    : null;
  const destination = activeRide
    ? { lat: activeRide.destination_lat, lng: activeRide.destination_lng }
    : null;

  const { route, eta, formattedDistance, formattedEta } = useRouteTracking(
    origin,
    destination,
    origin
  );

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

    // Check for active ride
    const checkActiveRide = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', profile.id)
        .in('status', ['accepted', 'ongoing', 'driver_arriving'])
        .single();

      if (data) {
        setActiveRide(data as Ride);
      }
    };
    checkActiveRide();

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
        .eq('status', 'pending');

      if (error) throw error;

      removeAvailableRide(ride.id);
      setSelectedRide(null);
      setActiveRide({ ...ride, status: 'accepted', driver_id: profile.id, final_price: ride.offer_price });

      toast({
        title: '¡Viaje aceptado!',
        description: 'Dirígete a recoger al pasajero',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'El viaje ya fue tomado por otro conductor',
        variant: 'destructive',
      });
    }
  }, [profile, removeAvailableRide, toast]);

  const updateRideStatus = async (status: 'driver_arriving' | 'ongoing' | 'completed') => {
    if (!activeRide) return;

    const updates: any = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      setTodayRides(prev => prev + 1);
      setTodayEarnings(prev => prev + (activeRide.final_price || activeRide.offer_price));
    }

    const { error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', activeRide.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    } else {
      setActiveRide(prev => prev ? { ...prev, status } : null);
      if (status === 'completed') {
        setActiveRide(null);
        toast({ title: 'Viaje Completado', description: '¡Buen trabajo!' });
      }
    }
  };

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

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (profile?.role !== 'driver') {
    return <Navigate to="/rider" />;
  }

  // Handle unverified drivers
  if (profile?.verification_status === 'unverified' || profile?.verification_status === 'pending') {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
      setUploading(true);
      // Simulate multiple document uploads
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('id', profile.id);

      if (!error) {
        toast({
          title: "Documentos recibidos",
          description: "Tu información está en revisión. Te avisaremos pronto.",
        });
        useAuthStore.getState().fetchProfile();
      }
      setUploading(false);
    };

    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-6 text-center bg-gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong p-8 rounded-3xl max-w-md w-full border border-primary/20"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            {profile?.verification_status === 'unverified' ? (
              <Shield className="w-12 h-12 text-primary neon-text" />
            ) : (
              <Clock className="w-12 h-12 text-accent animate-pulse" />
            )}
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Verificación de Conductor</h2>
          <p className="text-foreground/80 mb-8">
            {profile?.verification_status === 'unverified'
              ? 'Bienvenido a AntiGravity. Para comenzar a generar ingresos, necesitamos verificar tu licencia de conducir y propiedad del vehículo.'
              : '¡Todo listo por ahora! Tus documentos están siendo revisados por nuestro equipo de seguridad.'}
          </p>

          {profile?.verification_status === 'unverified' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 text-left">
                {[
                  { label: 'Licencia de Conducir', icon: Shield },
                  { label: 'Tarjeta de Propiedad', icon: Car },
                  { label: 'Cédula de Ciudadanía', icon: User }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 group hover:border-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <doc.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{doc.label}</div>
                      <div className="text-xs text-muted-foreground">Pendiente por subir</div>
                    </div>
                  </div>
                ))}
              </div>

              {uploading ? (
                <div className="space-y-3 p-6 glass rounded-2xl">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary font-bold">Verificando archivos...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary shadow-[0_0_15px_rgba(155,135,245,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground animate-pulse leading-tight">
                    Nuestro sistema de IA está analizando la validez de los documentos...
                  </p>
                </div>
              ) : (
                <Button variant="neon" size="xl" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20" onClick={handleUpload}>
                  Enviar a Verificación
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 text-accent transition-all">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Revisión en curso (24-48h)</span>
            </div>
          )}

          <Button
            variant="ghost"
            className="mt-8 text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión para Passenger Dashboard
          </Button>
        </motion.div>
      </div>
    );
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
                  <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="Rapicarm Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xl font-display font-bold">Rapi<span className="text-primary neon-text">carm</span></span>
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
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-muted-foreground text-left"
                >
                  <User className="w-5 h-5" />
                  Mi Perfil
                </button>
              </nav>

              {/* Weekly Performance Graph Mockup */}
              <div className="mt-8 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rendimiento Semanal</div>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-end justify-between h-24 gap-1">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className={`w-full rounded-t-md ${i === 3 ? 'bg-primary shadow-[0_0_10px_rgba(155,135,245,0.5)]' : 'bg-muted-foreground/20'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[8px] font-bold text-muted-foreground uppercase">
                  <span>Lun</span>
                  <span>Jue</span>
                  <span>Dom</span>
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

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-xl z-30 sticky top-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-secondary rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Rapicarm Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Rapi<span className="text-primary neon-text">carm</span></span>
        </div>

        {/* Online Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 shadow-lg ${isOnline
            ? 'bg-primary text-primary-foreground neon-glow font-bold'
            : 'bg-secondary text-muted-foreground border border-border'
            }`}
        >
          <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
          <span className="text-sm">
            {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
          </span>
        </button>
      </header>

      {/* Stats Bar - Professional Earnings Overview */}
      <div className="p-3 sm:p-4 bg-background/50 backdrop-blur-md">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="glass-strong rounded-2xl p-3 sm:p-4 border-b-4 border-primary shadow-xl flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Hoy</span>
            </div>
            <div className="text-lg sm:text-xl font-display font-black text-primary">
              ${todayEarnings.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-3 sm:p-4 border-b-4 border-accent shadow-xl flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Viajes</span>
            </div>
            <div className="text-lg sm:text-xl font-display font-black text-accent">
              {todayRides}
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-3 sm:p-4 border-b-4 border-purple-500 shadow-xl flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
              <Clock3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Online</span>
            </div>
            <div className="text-lg sm:text-xl font-display font-black text-purple-500">
              {isOnline ? '03:45' : '00:00'}h
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeRide ? (
          <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto safe-bottom">
            <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden glass border border-border">
              <MapComponent
                origin={{ lat: activeRide.origin_lat, lng: activeRide.origin_lng, address: activeRide.origin_address || '' }}
                destination={{ lat: activeRide.destination_lat, lng: activeRide.destination_lng, address: activeRide.destination_address || '' }}
              />
            </div>


            <div className="glass-strong p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-bold">Viaje en curso</h3>
                  <p className="text-sm text-muted-foreground">Estado: {
                    activeRide.status === 'accepted' ? 'Yendo a recoger' :
                      activeRide.status === 'driver_arriving' ? 'En el origen' :
                        'En camino al destino'
                  }</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-primary">${activeRide.final_price || activeRide.offer_price}</div>
                  <div className="text-xs text-muted-foreground">Pago en efectivo</div>
                </div>
              </div>

              {/* ETA Indicator */}
              {eta && (
                <ETAIndicator
                  eta={eta}
                  distance={formattedDistance}
                  status={activeRide.status === 'ongoing' ? 'ongoing' : 'arriving'}
                />
              )}

              {/* GPS Tracking Status */}
              {isTracking && (
                <div className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-xl">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-primary font-medium">GPS Activo</span>
                </div>
              )}

              <div className="space-y-3 py-4 border-y border-border">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 bg-primary rounded-full" />
                  <div className="text-sm font-medium">{activeRide.origin_address}</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 bg-accent rounded-full" />
                  <div className="text-sm font-medium">{activeRide.destination_address}</div>
                </div>
              </div>

              {/* Communication Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl border-primary/50 hover:bg-primary/10"
                  onClick={() => setIsChatOpen(true)}
                >
                  💬 Mensaje
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-primary/50 hover:bg-primary/10"
                  onClick={() => toast({ title: 'Llamando...', description: 'Función en desarrollo' })}
                >
                  📞 Llamar
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {activeRide.status === 'accepted' && (
                  <Button variant="neon" size="lg" className="w-full rounded-xl" onClick={() => updateRideStatus('driver_arriving')}>
                    ✅ He llegado al origen
                  </Button>
                )}
                {activeRide.status === 'driver_arriving' && (
                  <Button variant="neon" size="lg" className="w-full rounded-xl" onClick={() => updateRideStatus('ongoing')}>
                    🚗 Iniciar viaje
                  </Button>
                )}
                {activeRide.status === 'ongoing' && (
                  <Button variant="neon" size="lg" className="w-full rounded-xl" onClick={() => updateRideStatus('completed')}>
                    🏁 Completar viaje
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : !isOnline ? (
          <div className="h-full flex items-center justify-center p-6 relative">
            <div className="absolute inset-0 z-0 opacity-40">
              <MapComponent
                demandPoints={[
                  { lat: 3.4516, lng: -76.5320, intensity: 0.8 },
                  { lat: 3.3768, lng: -76.5312, intensity: 0.6 },
                  { lat: 3.4716, lng: -76.5220, intensity: 0.4 },
                  { lat: 3.4216, lng: -76.5120, intensity: 0.7 },
                ]}
              />
            </div>
            <div className="text-center z-10 glass p-8 rounded-2xl">
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
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
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
                    className="glass-strong rounded-xl p-4 cursor-pointer"
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

      {/* Floating Components */}
      {
        activeRide && profile && driverPosition && (
          <>
            <EmergencyButton
              rideId={activeRide.id}
              userId={profile.id}
              currentLocation={{
                lat: driverPosition.latitude,
                lng: driverPosition.longitude,
              }}
            />

            <ChatPanel
              rideId={activeRide.id}
              currentUserId={profile.id}
              otherUserName={riderName}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          </>
        )
      }
    </div >
  );
}
