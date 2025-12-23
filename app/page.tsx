'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useStore } from './lib/store';
import Header from './components/layout/Header';
import ChatInterface from './components/chat/ChatInterface';
import NewsSidebar from './components/news/NewsSidebar';
import MarketAnalysis from './components/Analysis/MarketAnalysis';
import APISettings from './components/Settings/APISettings';

type MarketAnalysisType = React.ComponentProps<typeof MarketAnalysis>['analysis'];

export default function Home() {
  const { 
    settings, 
    marketMode, 
    sidebarOpen, 
    setSidebarOpen,
    selectedArticle,
    setSelectedArticle,
    messages 
  } = useStore();
  
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<MarketAnalysisType | null>(null);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  // Check if market analysis should be shown
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (marketMode && latestMessage?.type === 'assistant' && latestMessage.marketAnalysis) {
      setCurrentAnalysis(latestMessage.marketAnalysis);
      setShowMarketAnalysis(true);
    }
  }, [messages, marketMode]);

  // Get related topic from latest chat
  const getRelatedTopic = () => {
    const latestUserMessage = [...messages]
      .reverse()
      .find(msg => msg.type === 'user');
    
    if (latestUserMessage) {
      const words = latestUserMessage.content
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 2)
        .join(' ');
      return words || 'breaking news';
    }
    
    return marketMode ? 'market news' : 'breaking news';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content - IMPROVED LAYOUT */}
      <div className="pt-16 md:pt-20 h-screen flex">
        {/* Chat Interface - NOW BIGGER (70-75% on large screens) */}
        <div className="flex-1 flex flex-col lg:w-3/4 xl:w-[70%]">
          <ChatInterface />
        </div>

        {/* News Sidebar - SMALLER (25-30% on large screens) */}
        <AnimatePresence>
          {(sidebarOpen || isLargeScreen) && (
            <div className={`
              ${sidebarOpen ? 'fixed inset-y-0 right-0 z-40' : 'hidden lg:block lg:w-1/4 xl:w-[30%]'}
              w-full max-w-sm lg:max-w-none
              pt-16 md:pt-20
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
        {showMarketAnalysis && currentAnalysis && (
          <MarketAnalysis
            analysis={currentAnalysis}
            isVisible={showMarketAnalysis}
            onClose={() => setShowMarketAnalysis(false)}
          />
        )}
      </AnimatePresence>

      {/* Market Analysis Trigger - Floating Button */}
      {currentAnalysis && !showMarketAnalysis && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowMarketAnalysis(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">View Analysis</span>
          </button>
        </div>
      )}

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
