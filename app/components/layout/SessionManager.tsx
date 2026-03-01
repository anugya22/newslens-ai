'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../context/AuthContext';

export const SessionManager = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { messages, setSessionId, clearMessages } = useStore();
    const initRef = useRef(false);

    useEffect(() => {
        // Only run this logic once on the very first client-side load
        if (initRef.current || authLoading) return;
        initRef.current = true;

        try {
            // 1. Check if this is a completely new tab/window by looking for our tabId
            let tabId = sessionStorage.getItem('newsLensTabId');

            if (!tabId) {
                // SCENARIO 1: Brand new tab, duplicated tab, or closed/reopened browser
                // -> Give them a unique tab ID and start completely fresh
                tabId = crypto.randomUUID();
                sessionStorage.setItem('newsLensTabId', tabId);
                sessionStorage.setItem('newsLensRefreshCount', '0');
                clearMessages(); // Reset Zustand chat history
                return;
            }

            // SCENARIO 2: This is a page refresh within the same tab
            const currentRefreshes = parseInt(sessionStorage.getItem('newsLensRefreshCount') || '0', 10);
            const newRefreshes = currentRefreshes + 1;

            sessionStorage.setItem('newsLensRefreshCount', newRefreshes.toString());

            // Only check limits if there's actually a chat going on
            if (messages.length > 0) {
                // Logged-in users get 3 "grace" refreshes before wipe. Guests get 1.
                const maxRefreshes = user ? 3 : 1;

                if (newRefreshes > maxRefreshes) {
                    // Trigger wipe down
                    clearMessages();
                    sessionStorage.setItem('newsLensRefreshCount', '0'); // reset counter after wipe
                }
            } else {
                // If they have no messages anyway, just keep their counter at 0
                sessionStorage.setItem('newsLensRefreshCount', '0');
            }

        } catch (e) {
            console.warn("Session Storage unavailable, defaulting to fresh chat.");
            clearMessages();
        }
    }, [authLoading, user, messages.length, clearMessages]);

    return null; // Invisible strictly-logical component
};
