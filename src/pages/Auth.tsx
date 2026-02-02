import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

type AuthMode = 'login' | 'signup' | 'forgot';
type UserRole = 'rider' | 'driver';

export function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('rider');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    console.log('Auth State check:', { isAuthLoading, isAuthenticated, profileRole: profile?.role });

    if (!isAuthLoading && isAuthenticated) {
      if (profile) {
        const dest = profile.role === 'driver' ? '/driver' : '/rider';
        console.log('Redirecting to:', dest);
        navigate(dest, { replace: true });
      } else {
        console.log('User authenticated but profile still missing.');
        toast({
          title: "Perfil en proceso",
          description: "Estamos preparando tu dashboard. Si esto tarda más de 5 segundos, por favor refresca la página.",
          variant: "default"
        });
      }
    }
  }, [isAuthenticated, profile, navigate, isAuthLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: '¡Bienvenido de vuelta!',
          description: 'Has iniciado sesión correctamente.',
        });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: formData.fullName,
              role: selectedRole,
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;

        toast({
          title: '¡Cuenta creada!',
          description: 'Revisa tu correo para confirmar tu cuenta.',
        });
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          { redirectTo: `${window.location.origin}/auth?mode=reset` }
        );

        if (error) throw error;

        toast({
          title: 'Correo enviado',
          description: 'Revisa tu bandeja para restablecer tu contraseña.',
        });
      }
    } catch (error: any) {
      console.error('Auth action error:', error);
      let message = error.message || 'Algo salió mal. Intenta de nuevo.';

      if (message.includes('User already registered') || message.includes('already exists')) {
        message = 'Este correo ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.';
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-md"
        >
          {/* Back to home */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">
              Anti<span className="text-primary">Gravity</span>
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {mode === 'login' ? 'Bienvenido de vuelta' : mode === 'signup' ? 'Crea tu cuenta' : 'Recupera tu contraseña'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {mode === 'login' ? 'Ingresa tus credenciales para continuar' : mode === 'signup' ? 'Únete a la revolución del transporte' : 'Te enviaremos un enlace para restablecerla'}
            </p>
          </div>

          {/* Fallback Entry Button if stuck */}
          {isAuthenticated && (
            <div className="mb-8 p-6 bg-primary/10 border border-primary rounded-2xl animate-in fade-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-primary mb-2">¡Sesión Detectada!</h3>
              <p className="text-sm text-muted-foreground mb-4">Ya has iniciado sesión correctamente.</p>
              <Button
                onClick={() => navigate(profile?.role === 'driver' ? '/driver' : '/rider')}
                variant="neon"
                className="w-full h-12"
              >
                Entrar al Dashboard Ahora
              </Button>
              <button
                onClick={() => useAuthStore.getState().signOut()}
                className="w-full text-xs text-muted-foreground mt-4 hover:text-foreground underline"
              >
                O cerrar sesión para entrar con otra cuenta
              </button>
            </div>
          )}

          {/* Role Selection for Signup */}
          {mode === 'signup' && (
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground mb-3 block">
                ¿Cómo quieres usar AntiGravity?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('rider')}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'rider'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                    }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'rider' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-medium ${selectedRole === 'rider' ? 'text-primary' : ''}`}>Pasajero</div>
                  <div className="text-xs text-muted-foreground">Quiero viajar</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'driver'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                    }`}
                >
                  <Car className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'driver' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-medium ${selectedRole === 'driver' ? 'text-primary' : ''}`}>Conductor</div>
                  <div className="text-xs text-muted-foreground">Quiero ganar</div>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10 h-12 bg-secondary border-border"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 bg-secondary border-border"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 bg-secondary border-border"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 123 456 7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-12 bg-secondary border-border"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="neon"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'signup' && 'Crear Cuenta'}
                  {mode === 'forgot' && 'Enviar Enlace'}
                </>
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center text-muted-foreground">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Regístrate
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Inicia sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('login')}
                className="text-primary hover:underline font-medium"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-mesh items-center justify-center p-12">
        <div
          className="max-w-lg text-center"
        >
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 neon-glow animate-float">
            <Car className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">
            La libertad de elegir tu precio
          </h2>
          <p className="text-muted-foreground text-lg">
            Con AntiGravity, el poder está en tus manos.
            Negocia directamente con conductores y obtén el mejor precio para tu viaje.
          </p>
        </div>
      </div>
    </div>
  );
}
