'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PortfolioNewsService, PortfolioAlert } from '../lib/portfolioNews';

interface AssetNewsContextType {
    newsFeed: PortfolioAlert[];
    isLoading: boolean;
    lastFetchTime: number | null;
    refreshNews: () => Promise<void>;
}

const AssetNewsContext = createContext<AssetNewsContextType>({
    newsFeed: [],
    isLoading: false,
    lastFetchTime: null,
    refreshNews: async () => { }
});

export const useAssetNews = () => useContext(AssetNewsContext);

export function AssetNewsProvider({ children }: { children: React.ReactNode }) {
    const { user, session } = useAuth();
    const [newsFeed, setNewsFeed] = useState<PortfolioAlert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

    const newsService = useRef(new PortfolioNewsService());
    const hasFetchedOnLoad = useRef(false);

    const loadCachedNews = useCallback(() => {
        if (!user) return;
        try {
            const cached = localStorage.getItem(`asset-news-${user.id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Check if the cache is older than 24 hours (86400000 ms)
                const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;

                if (!isExpired) {
                    setNewsFeed(parsed.data);
                    setLastFetchTime(parsed.timestamp);
                    return true; // Successfully loaded valid cache
                } else {
                    // Purge expired cache
                    localStorage.removeItem(`asset-news-${user.id}`);
                }
            }
        } catch (e) {
            console.error('Failed to load cached asset news', e);
        }
        return false;
    }, [user]);

    const refreshNews = useCallback(async () => {
        if (!user || !session?.access_token) return;

        setIsLoading(true);
        try {
            // Get user's portfolio symbols
            // Note: If you have a custom hook for portfolio data, it would be ideal here.
            // For now, PortfolioNewsService will fetch the portfolio internally if needed.
            // Wait, PortfolioNewsService expects an array of symbols.
            // We need to fetch the portfolio symbols here first to pass them.

            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/portfolio_items?select=symbol`, {
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch portfolio symbols');
            const data = await res.json();
            const symbols = Array.from(new Set(data.map((item: any) => item.symbol))) as string[];

            if (symbols.length === 0) {
                setNewsFeed([]);
                setIsLoading(false);
                return;
            }

            // In Phase 3, getNewsForSymbols will directly query Google News for these exact symbols.
            const alerts = await newsService.current.getNewsForSymbols(symbols);

            setNewsFeed(alerts);
            setLastFetchTime(Date.now());

            // Cache the results
            localStorage.setItem(`asset-news-${user.id}`, JSON.stringify({
                timestamp: Date.now(),
                data: alerts
            }));

        } catch (error) {
            console.error('Failed to globally refresh asset news:', error);
        } finally {
            setIsLoading(false);
        }

    }, [user, session]);


    useEffect(() => {
        if (!user || hasFetchedOnLoad.current) {
            // Reset if user logs out
            if (!user) {
                hasFetchedOnLoad.current = false;
                setNewsFeed([]);
            }
            return;
        }

        const validCacheLoaded = loadCachedNews();

        // If no cache, or cache is expired, fetch immediately on login.
        if (!validCacheLoaded) {
            refreshNews();
        }

        hasFetchedOnLoad.current = true;

    }, [user, loadCachedNews, refreshNews]);

    return (
        <AssetNewsContext.Provider value={{ newsFeed, isLoading, lastFetchTime, refreshNews }}>
            {children}
        </AssetNewsContext.Provider>
    );
}
