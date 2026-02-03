import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Clock, ShoppingBag, Plus, Minus, ArrowLeft, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Mock Data
const CATEGORIES = [
    { id: '1', name: 'Pizza', icon: '🍕' },
    { id: '2', name: 'Burger', icon: '🍔' },
    { id: '3', name: 'Sushi', icon: '🍱' },
    { id: '4', name: 'Tacos', icon: '🌮' },
    { id: '5', name: 'Healthy', icon: '🥗' },
];

const RESTAURANTS = [
    {
        id: '1',
        name: 'Burger King',
        rating: 4.5,
        deliveryTime: '25-35 min',
        deliveryFee: 4500,
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80',
        category: 'Burger',
        menu: [
            { id: '101', name: 'Whopper Combo', price: 28900, description: 'Whopper con queso, papas y refresco', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80' },
            { id: '102', name: 'King de Pollo', price: 24500, description: 'Sandwich de pollo crujiente', image: 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=500&q=80' },
        ]
    },
    {
        id: '2',
        name: 'Pizza Hut',
        rating: 4.3,
        deliveryTime: '30-45 min',
        deliveryFee: 5000,
        image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&q=80',
        category: 'Pizza',
        menu: [
            { id: '201', name: 'Pepperoni Lover', price: 45900, description: 'Extra pepperoni y queso', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80' },
            { id: '202', name: 'Hawaiian', price: 42900, description: 'Jamón y piña', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80' },
        ]
    },
    {
        id: '3',
        name: 'Sushi Roll',
        rating: 4.7,
        deliveryTime: '40-50 min',
        deliveryFee: 6000,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80',
        category: 'Sushi',
        menu: [
            { id: '301', name: 'California Roll', price: 32000, description: 'Cangrejo, pepino y aguacate', image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&q=80' },
            { id: '302', name: 'Spicy Tuna', price: 38500, description: 'Atún picante y cebollín', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80' },
        ]
    }
];

export function FoodPanel() {
    const [view, setView] = useState<'list' | 'restaurant' | 'checkout'>('list');
    const [selectedRestaurant, setSelectedRestaurant] = useState<typeof RESTAURANTS[0] | null>(null);
    const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.reduce((acc, item) => {
            if (item.id === id) {
                if (item.quantity > 1) return [...acc, { ...item, quantity: item.quantity - 1 }];
                return acc;
            }
            return [...acc, item];
        }, [] as any[]));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = selectedRestaurant?.deliveryFee || 0;
    const finalTotal = cartTotal + deliveryFee;

    const handleOrder = () => {
        setOrderStatus('processing');
        setTimeout(() => {
            setOrderStatus('confirmed');
        }, 2000);
    };

    if (orderStatus === 'confirmed') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">¡Pedido Confirmado!</h2>
                <p className="text-muted-foreground mb-8">
                    Tu comida de {selectedRestaurant?.name} está siendo preparada y llegará en {selectedRestaurant?.deliveryTime}.
                </p>
                <Button
                    variant="neon"
                    onClick={() => {
                        setOrderStatus('idle');
                        setCart([]);
                        setView('list');
                        setSelectedRestaurant(null);
                    }}
                >
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-4">
                {view !== 'list' && (
                    <button onClick={() => setView('list')} className="p-2 hover:bg-secondary rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-lg font-display font-bold">
                    {view === 'list' && 'Restaurantes'}
                    {view === 'restaurant' && selectedRestaurant?.name}
                    {view === 'checkout' && 'Tu Pedido'}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Restaurant List */}
                {view === 'list' && (
                    <div className="space-y-6">
                        {/* Categories */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} className="flex flex-col items-center gap-2 min-w-[70px]">
                                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-2xl hover:bg-primary/20 transition-colors border border-border">
                                        {cat.icon}
                                    </div>
                                    <span className="text-xs font-medium">{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Restaurants */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center justify-between">
                                <span>Restaurantes detectados</span>
                                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                    Cerca de tu ubicación
                                </span>
                            </h3>
                            {RESTAURANTS.map(restaurant => (
                                <motion.div
                                    key={restaurant.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedRestaurant(restaurant);
                                        setView('restaurant');
                                    }}
                                    className="bg-card rounded-xl overflow-hidden border border-border shadow-sm cursor-pointer group"
                                >
                                    <div className="h-32 w-full overflow-hidden relative">
                                        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-primary" />
                                            {restaurant.deliveryTime}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-lg">{restaurant.name}</h4>
                                            <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded text-green-500 text-xs font-bold">
                                                <Star className="w-3 h-3 fill-current" />
                                                {restaurant.rating}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>{restaurant.category}</span>
                                            <span>•</span>
                                            <Truck className="w-3 h-3" />
                                            <span>Delivery ${restaurant.deliveryFee.toLocaleString('es-CO')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Restaurant Details */}
                {view === 'restaurant' && selectedRestaurant && (
                    <div className="space-y-6">
                        <div className="relative h-48 rounded-2xl overflow-hidden">
                            <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h1 className="text-3xl font-display font-bold">{selectedRestaurant.name}</h1>
                                <p className="text-sm opacity-90">{selectedRestaurant.category} • {selectedRestaurant.deliveryTime}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-xl">Menú</h3>
                            {selectedRestaurant.menu.map(item => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/50 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base mb-1">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-primary">${item.price.toLocaleString('es-CO')}</span>
                                            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => addToCart(item)}>
                                                <Plus className="w-4 h-4 mr-1" />
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Checkout */}
                {view === 'checkout' && (
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl p-4 border border-border">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Resumen del Pedido
                            </h3>
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                                            <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-destructive"><Minus className="w-3 h-3" /></button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1 hover:text-primary"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <span className="font-bold">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                                </div>
                            ))}

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Envío</span>
                                    <span>${deliveryFee.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg mt-2">
                                    <span>Total</span>
                                    <span className="text-primary">${finalTotal.toLocaleString('es-CO')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <Truck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <div className="font-medium">Dirección de entrega</div>
                                <div className="text-sm text-muted-foreground">Ubicación Actual (Detectada)</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cart Buffer / Bottom Bar */}
            {cart.length > 0 && view !== 'checkout' && (
                <div className="p-4 border-t border-border bg-background/80 backdrop-blur sticky bottom-0 z-20">
                    <Button onClick={() => setView('checkout')} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" variant="neon">
                        <div className="flex justify-between w-full items-center">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary-foreground text-primary text-xs w-6 h-6 rounded-full flex items-center justify-center">
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                                <span>Ver Pedido</span>
                            </div>
                            <span>${cartTotal.toLocaleString('es-CO')}</span>
                        </div>
                    </Button>
                </div>
            )}

            {view === 'checkout' && (
                <div className="p-4 border-t border-border bg-background/80 backdrop-blur sticky bottom-0 z-20">
                    <Button
                        onClick={handleOrder}
                        disabled={orderStatus === 'processing'}
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                        variant="neon"
                    >
                        {orderStatus === 'processing' ? (
                            <><div className="animate-spin mr-2">C</div> Procesando...</>
                        ) : (
                            `Pagar $${finalTotal.toLocaleString('es-CO')}`
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
