'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useStore } from './lib/store';
import Header from './components/layout/Header';
import ChatInterface from './components/chat/ChatInterface';
import NewsSidebar from './components/news/NewsSidebar';
import MarketAnalysis from './components/Analysis/MarketAnalysis';


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
      const content = latestUserMessage.content;

      // 1. Look for explicit stock symbols/crypto (uppercase, 2-5 chars, maybe starting with $)
      // Regex for potential tickers: \b[A-Z]{2,5}\b or \$[A-Za-z]{2,5}
      const tickerMatch = content.match(/\b[A-Z]{2,5}\b/g) || content.match(/\$[A-Za-z]{2,5}/g);

      if (tickerMatch && tickerMatch.length > 0) {
        return tickerMatch[0].replace('$', '');
      }

      // 2. Fallback: Extract first meaningful keyword (simple split)
      const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(' ')
        .filter(word => word.length > 3 && !['what', 'when', 'where', 'price', 'news', 'about', 'analysis'].includes(word));

      if (words.length > 0) {
        return words[0]; // User asked for "first word" relevance
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="pt-24 md:pt-28 h-screen flex relative z-0">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>

        {/* News Sidebar - SMALLER (25-30% on large screens) */}
        <AnimatePresence>
          {(sidebarOpen || isLargeScreen) && (
            <div className={`
              ${sidebarOpen ? 'fixed inset-y-0 right-0 z-40' : 'hidden lg:block'}
              w-full max-w-sm lg:max-w-md xl:max-w-lg
            `}>
              <div className="h-full p-4">
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
