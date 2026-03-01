'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const HistoryHydrator = () => {
    const { messages, sessionId, setSessionId, addMessage } = useStore();
    const { user, isLoading: authLoading } = useAuth();
    const hasHydrated = useRef(false);

    useEffect(() => {
        // Only attempt hydration once per mounting/session change
        if (hasHydrated.current || authLoading || !user || !sessionId) return;

        const hydrateSession = async () => {
            // Check if we already have messages in store (from localStorage)
            if (messages.length > 0) {
                hasHydrated.current = true;
                return;
            }

            try {
                // Fetch the messages for the current sessionId from Supabase
                const { data, error } = await supabase
                    .from('chat_history')
                    .select('*')
                    .eq('session_id', sessionId)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Hydration Error:', error);
                    return;
                }

                if (data && data.length > 0) {
                    // Update the local store with fetched messages
                    data.forEach(msg => {
                        addMessage({
                            id: msg.id,
                            type: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.content,
                            timestamp: new Date(msg.created_at).toISOString()
                        });
                    });
                }
                hasHydrated.current = true;
            } catch (err) {
                console.error('Failed to hydrate chat history:', err);
            }
        };

        hydrateSession();
    }, [user, authLoading, sessionId, messages.length, addMessage]);

    return null; // This component doesn't render anything
};
