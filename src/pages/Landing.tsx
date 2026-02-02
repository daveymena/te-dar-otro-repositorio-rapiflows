import { motion } from 'framer-motion';
import { Car, Users, DollarSign, Shield, MapPin, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-background/80 bg-gradient-mesh" />
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="container mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-glow">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                Anti<span className="text-primary neon-text">Gravity</span>
              </span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link to="/auth">
                <Button variant="ghost" size="lg">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="neon" size="lg">
                  Registrarse
                </Button>
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-2 h-2 bg-primary rounded-full pulse-online" />
              <span className="text-sm text-muted-foreground">
                La revolución del transporte llegó
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight">
              <span className="text-foreground">Rompe las</span>
              <br />
              <span className="text-primary neon-text">Reglas del Juego</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Sin precios fijos. Sin algoritmos injustos. 
              <span className="text-foreground font-medium"> Tú decides cuánto pagar.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/rider">
                <Button variant="neon" size="xl" className="group">
                  <Users className="w-5 h-5" />
                  Soy Pasajero
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/driver">
                <Button variant="neon-outline" size="xl" className="group">
                  <Car className="w-5 h-5" />
                  Soy Conductor
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-display font-bold text-primary neon-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-mesh">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              ¿Por qué <span className="text-primary">AntiGravity</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una plataforma diseñada para ti, no para las corporaciones
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-strong rounded-2xl p-6 hover:border-primary/50 transition-colors group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Así de <span className="text-accent neon-text-cyan">Simple</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Indica tu destino', desc: 'Selecciona origen y destino en el mapa' },
              { step: '02', title: 'Propón tu precio', desc: 'Ve el estimado y ofrece lo que quieras pagar' },
              { step: '03', title: 'Negocia y viaja', desc: 'Los conductores aceptan o contraofrecen' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="text-6xl font-display font-bold text-primary/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-mesh">
        <div className="container mx-auto px-6">
          <motion.div
            className="glass-strong rounded-3xl p-12 text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              ¿Listo para <span className="text-primary neon-text">despegar</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya disfrutan de viajes justos y transparentes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button variant="neon" size="xl">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="glass" size="xl">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">AntiGravity</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 AntiGravity. Construido para romper barreras.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
