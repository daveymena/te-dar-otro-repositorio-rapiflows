import { Car, Users, DollarSign, Shield, MapPin, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  {
    icon: DollarSign,
    title: 'Tú Pones el Precio',
    description: 'Negocia en tiempo real. Sin tarifas fijas impuestas por algoritmos.',
  },
  {
    icon: MapPin,
    title: 'Geolocalización Precisa',
    description: 'Tecnología PostGIS para encontrar conductores en segundos.',
  },
  {
    icon: Shield,
    title: 'Seguridad Total',
    description: 'Comparte tu viaje en vivo con contactos de confianza.',
  },
  {
    icon: Zap,
    title: 'Tiempo Real',
    description: 'Sincronización instantánea. Sin retrasos, sin esperas.',
  },
];

const stats = [
  { value: '50K+', label: 'Usuarios Activos' },
  { value: '10K+', label: 'Conductores' },
  { value: '1M+', label: 'Viajes Completados' },
  { value: '4.9★', label: 'Calificación' },
];

const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop";

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 overflow-x-hidden w-full relative font-sans">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE_URL}
            alt="Rapicarm Transport"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Multi-layer Gradient for Text Protection */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20 z-10" />
        </div>

        {/* Navigation Wrapper */}
        <nav className="absolute top-0 left-0 right-0 z-[100] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Car className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tight text-white">
                Rapi<span className="text-primary">carm</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">Iniciar Sesión</Link>
              <Link to="/auth?mode=signup">
                <Button variant="neon" size="default" className="rounded-full px-8">
                  Únete Gratis
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-6 relative z-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Disponible Ahora</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-display font-black leading-[1.1] mb-6 drop-shadow-sm">
                Transporte <span className="text-primary italic">Justo</span>,<br />
                A Tu Manera.
              </h1>

              <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-lg">
                La primera plataforma donde tú decides el precio. Sin algoritmos invisibles, solo personas conectando con personas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/rider" className="flex-1 sm:flex-none">
                  <Button size="xl" variant="neon" className="w-full sm:w-auto rounded-full group px-10">
                    Pedir un Viaje
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/driver" className="flex-1 sm:flex-none">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto rounded-full border-white/20 text-white hover:bg-white/10 px-10">
                    Quiero Conducir
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Overlay Bottom */}
        <div className="absolute bottom-12 left-0 right-0 z-20 hidden lg:block">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="flex gap-12 border-l border-white/10 pl-8">
              {stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - White Section for Contrast */}
      <section className="py-32 bg-white text-black relative z-10">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-display font-black mb-8 leading-tight">
                ¿Por qué elegir <span className="text-primary">Rapicarm</span> sobre los demás?
              </h2>
              <div className="space-y-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-[#f0f0f0] rounded-[3rem] overflow-hidden rotate-3 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop"
                  alt="Feature illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-primary p-8 rounded-3xl shadow-xl -rotate-6 hidden sm:block">
                <div className="text-4xl font-black text-black">100%</div>
                <div className="text-sm font-bold text-black/60 uppercase tracking-tighter">Transparente</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="bg-primary p-12 lg:p-20 rounded-[3rem] text-center relative overflow-hidden">
            <div className="relative z-10 text-black">
              <h2 className="text-4xl lg:text-6xl font-display font-black mb-8 tracking-tighter">
                Únete a la nueva era del transporte.
              </h2>
              <p className="text-lg font-medium mb-12 max-w-xl mx-auto opacity-80">
                Miles de personas ya están negociando sus viajes de forma justa y segura. ¿Qué esperas?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <Button size="xl" className="bg-black text-white hover:bg-neutral-800 rounded-full px-12">
                    Empezar Ahora
                  </Button>
                </Link>
              </div>
            </div>
            {/* Background elements for CTA */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Basic Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#0a0a0a]">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tight">Rapicarm</span>
          </div>
          <p className="text-sm text-gray-500 italic">"Diseñado para personas, no para algoritmos."</p>
          <div className="text-xs text-gray-600">© 2024 Rapicarm S.A. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
