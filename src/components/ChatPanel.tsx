import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat, ChatMessage } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
    rideId: string;
    currentUserId: string;
    otherUserName: string;
    isOpen: boolean;
    onClose: () => void;
    onCallPress?: () => void;
}

export function ChatPanel({
    rideId,
    currentUserId,
    otherUserName,
    isOpen,
    onClose,
    onCallPress,
}: ChatPanelProps) {
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages, isSending, sendMessage, markAllAsRead } = useChat(rideId, currentUserId);

    useEffect(() => {
        if (isOpen) {
            markAllAsRead();
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages, markAllAsRead]);

    const handleSend = async () => {
        if (!messageText.trim() || isSending) return;
        await sendMessage(messageText);
        setMessageText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Chat Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-border max-h-[80vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/30">
                                    <span className="text-primary font-bold text-sm">
                                        {otherUserName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{otherUserName}</h3>
                                    <p className="text-xs text-muted-foreground">En línea</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {onCallPress && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onCallPress}
                                        className="rounded-full hover:bg-primary/10"
                                    >
                                        <Phone className="w-5 h-5 text-primary" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-secondary"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background to-secondary/5">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        Aún no hay mensajes. ¡Inicia la conversación!
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isOwn={msg.sender_id === currentUserId}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-secondary/50 border-border rounded-full px-4 h-12 focus:ring-2 focus:ring-primary/50"
                                    disabled={isSending}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!messageText.trim() || isSending}
                                    size="icon"
                                    className="rounded-full w-12 h-12 neon-glow"
                                    variant="neon"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
    const time = new Date(message.created_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
        >
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 shadow-md',
                    isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                )}
            >
                <p className="text-sm break-words">{message.message}</p>
                <p
                    className={cn(
                        'text-[10px] mt-1 text-right',
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                >
                    {time}
                </p>
            </div>
        </motion.div>
    );
}
