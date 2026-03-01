'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useStore } from '../lib/store';
import Header from '../components/layout/Header';
import ChatInterface from '../components/chat/ChatInterface';
import NewsSidebar from '../components/news/NewsSidebar';
import MarketAnalysis from '../components/Analysis/MarketAnalysis';
import HistorySidebar from '../components/layout/HistorySidebar';
import { HistoryHydrator } from '../components/chat/HistoryHydrator';


type MarketAnalysisType = React.ComponentProps<typeof MarketAnalysis>['analysis'];

export default function Home() {
  const {
    settings,
    marketMode,
    cryptoMode,
    sidebarOpen,
    setSidebarOpen,
    selectedArticle,
    setSelectedArticle,
    selectedAnalysis,
    messages
  } = useStore();

  // Header handles its own settings modal, so we don't need this state
  // Market Analysis is now handled globally via selectedAnalysis in store

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);



  // Get related topic from latest chat
  const getRelatedTopic = () => {
    const latestUserMessage = [...messages]
      .reverse()
      .find(msg => msg.type === 'user');

    if (latestUserMessage) {
      const content = latestUserMessage.content.toLowerCase();

      // 1. Priority: Check if message contains any key from our global ticker map
      const knownSymbols = [
        'bajaj', 'reliance', 'nifty', 'sensex', 'hdfc', 'tata', 'tcs',
        'bitcoin', 'ethereum', 'gold', 'crude', 'apple', 'nvidia', 'tesla',
        'zomato', 'paytm', 'adani', 'infosys'
      ];

      for (const symbol of knownSymbols) {
        if (content.includes(symbol)) return symbol;
      }

      // 2. Look for explicit stock symbols/crypto (uppercase, 2-5 chars, maybe starting with $)
      const tickerMatch = latestUserMessage.content.match(/\b[A-Z]{2,5}\b/g) || latestUserMessage.content.match(/\$[A-Za-z]{2,5}/g);
      if (tickerMatch && tickerMatch.length > 0) {
        return tickerMatch[0].replace('$', '');
      }

      // 3. Fallback: Extract the MOST meaningful keyword
      const stopWords = [
        'what', 'when', 'where', 'price', 'news', 'about', 'analysis',
        'latest', 'whats', 'tell', 'show', 'find', 'search', 'give',
        'please', 'hows', 'does', 'with', 'mode', 'chat', 'know', 'today',
        'compared', 'looking', 'today', 'than', 'more', 'less', 'versus', 'market'
      ];

      const words = content
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));

      if (words.length > 0) {
        const sortedWords = [...words].sort((a, b) => b.length - a.length);
        return sortedWords[0];
      }
    }

    // Default topics based on mode
    if (cryptoMode) return 'cryptocurrency';
    if (marketMode) return 'market';
    return 'breaking news';
  };

  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-transparent text-slate-900 dark:text-white transition-colors duration-300 relative">
      {/* Background Pattern & Gradient Orb */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/20 dark:bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <Header />

      {/* History Hydrator (Sync from Supabase if needed) */}
      <HistoryHydrator />

      {/* History Sidebar - Full Height Edge */}
      <HistorySidebar />

      {/* Main Content */}
      <div className="flex-1 flex relative z-0 pt-20 md:pt-24 pb-0 h-full overflow-hidden">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white/40 dark:bg-black/10 backdrop-blur-3xl">
          <ChatInterface />
        </div>

        {/* News Sidebar - SMALLER (25-30% on large screens) */}
        <AnimatePresence>
          {(sidebarOpen || isLargeScreen) && (
            <div className={`
              ${sidebarOpen ? 'fixed inset-y-0 right-0 z-40' : 'hidden lg:flex lg:flex-col'}
              w-full max-w-sm lg:max-w-md xl:max-w-lg bg-gray-50/50 dark:bg-black/20 border-l border-gray-200 dark:border-gray-800
              overflow-hidden
            `}>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <NewsSidebar relatedTopic={getRelatedTopic()} />
              </div>

              {/* Mobile Overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                  style={{ zIndex: -1 }}
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Market Analysis Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <MarketAnalysis
            analysis={selectedAnalysis}
            isVisible={!!selectedAnalysis}
            onClose={() => useStore.getState().setSelectedAnalysis(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating button removed as per design - user accesses analysis via chat bubbles */}

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Article Details
                  </h2>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedArticle.image && (
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedArticle.title}
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {selectedArticle.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Source: {selectedArticle.source}</span>
                  <span>{new Date(selectedArticle.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-6">
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Read Full Article
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: settings.theme === 'dark' ? '#374151' : '#ffffff',
            color: settings.theme === 'dark' ? '#ffffff' : '#111827',
            border: '1px solid',
            borderColor: settings.theme === 'dark' ? '#4B5563' : '#E5E7EB',
          },
        }}
      />
    </div>
  );
}
