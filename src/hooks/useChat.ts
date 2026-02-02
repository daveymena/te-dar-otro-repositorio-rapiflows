import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
    id: string;
    ride_id: string;
    sender_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export function useChat(rideId: string | null, currentUserId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Load existing messages
    useEffect(() => {
        if (!rideId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        supabase
            .from('chat_messages')
            .select('*')
            .eq('ride_id', rideId)
            .order('created_at', { ascending: true })
            .then(({ data, error }) => {
                if (!error && data) {
                    setMessages(data);
                }
                setIsLoading(false);
            });
    }, [rideId]);

    // Subscribe to new messages
    useEffect(() => {
        if (!rideId) return;

        const channel = supabase
            .channel(`chat-${rideId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `ride_id=eq.${rideId}`,
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages((prev) => [...prev, newMessage]);

                    // Mark as read if it's not from current user
                    if (newMessage.sender_id !== currentUserId) {
                        supabase
                            .from('chat_messages')
                            .update({ is_read: true })
                            .eq('id', newMessage.id)
                            .then();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rideId, currentUserId]);

    const sendMessage = useCallback(
        async (messageText: string) => {
            if (!rideId || !currentUserId || !messageText.trim()) return;

            setIsSending(true);
            try {
                const { error } = await supabase.from('chat_messages').insert({
                    ride_id: rideId,
                    sender_id: currentUserId,
                    message: messageText.trim(),
                });

                if (error) throw error;
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setIsSending(false);
            }
        },
        [rideId, currentUserId]
    );

    const markAllAsRead = useCallback(async () => {
        if (!rideId || !currentUserId) return;

        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('ride_id', rideId)
            .neq('sender_id', currentUserId)
            .eq('is_read', false);
    }, [rideId, currentUserId]);

    const unreadCount = messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== currentUserId
    ).length;

    return {
        messages,
        isLoading,
        isSending,
        unreadCount,
        sendMessage,
        markAllAsRead,
    };
}
