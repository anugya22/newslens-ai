'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Key, Eye, EyeOff, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useStore } from '../../lib/store';
import toast from 'react-hot-toast';

interface APISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const APISettings: React.FC<APISettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStore();
  const [showKeys, setShowKeys] = useState({
    openRouter: false,
    newsApi: false,
    alphaVantage: false,
  });
  
  const [formData, setFormData] = useState({
    openRouterKey: settings.openRouterKey || '',
    newsApiKey: settings.newsApiKey || '',
    alphaVantageKey: settings.alphaVantageKey || '',
    autoRefresh: settings.autoRefresh,
    notifications: settings.notifications,
  });

  const [testResults, setTestResults] = useState({
    openRouter: null as boolean | null,
    newsApi: null as boolean | null,
    alphaVantage: null as boolean | null,
  });

  const testAPIKey = async (service: string, key: string) => {
    if (!key.trim()) {
      toast.error(`Please enter a ${service} API key first`);
      return;
    }

    try {
      let isValid = false;
      
      switch (service) {
        case 'openRouter':
          // Test OpenRouter API
          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          });
          isValid = openRouterResponse.ok;
          break;
          
        case 'newsApi':
          // Test News API (if using NewsAPI.org)
          const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${key}`);
          isValid = newsResponse.ok;
          break;
          
        case 'alphaVantage':
          // Test Alpha Vantage API
          const alphaResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${key}`);
          const alphaData = await alphaResponse.json();
          isValid = !alphaData['Error Message'] && !alphaData['Note'];
          break;
      }

      setTestResults(prev => ({ ...prev, [service]: isValid }));
      
      if (isValid) {
        toast.success(`${service} API key is valid!`);
      } else {
        toast.error(`${service} API key is invalid`);
      }
    } catch (error) {
      console.error(`Error testing ${service} API:`, error);
      setTestResults(prev => ({ ...prev, [service]: false }));
      toast.error(`Failed to test ${service} API key`);
    }
  };

  const handleSave = () => {
    updateSettings({
      openRouterKey: formData.openRouterKey.trim(),
      newsApiKey: formData.newsApiKey.trim(),
      alphaVantageKey: formData.alphaVantageKey.trim(),
      autoRefresh: formData.autoRefresh,
      notifications: formData.notifications,
    });
    
    toast.success('Settings saved successfully!');
    onClose();
  };

  const toggleShowKey = (service: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary-500 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  API Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure your API keys and preferences
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-8">
          {/* API Keys Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>API Keys</span>
            </h3>

            {/* OpenRouter API Key */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                OpenRouter API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.openRouter ? 'text' : 'password'}
                  value={formData.openRouterKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, openRouterKey: e.target.value }))}
                  className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="sk-or-..."
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openRouter')}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {showKeys.openRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => testAPIKey('openRouter', formData.openRouterKey)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Test API Key"
                  >
                    {testResults.openRouter === true ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : testResults.openRouter === false ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Required for AI analysis. Get your key from{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                  openrouter.ai
                </a>
              </p>
            </div>

            {/* News API Key */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                News API Key <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.newsApi ? 'text' : 'password'}
                  value={formData.newsApiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, newsApiKey: e.target.value }))}
                  className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter NewsAPI.org key (optional)"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => toggleShowKey('newsApi')}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {showKeys.newsApi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => testAPIKey('newsApi', formData.newsApiKey)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Test API Key"
                  >
                    {testResults.newsApi === true ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : testResults.newsApi === false ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                For enhanced news coverage. Uses free Google News RSS if not provided.
              </p>
            </div>

            {/* Alpha Vantage API Key */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alpha Vantage API Key <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showKeys.alphaVantage ? 'text' : 'password'}
                  value={formData.alphaVantageKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, alphaVantageKey: e.target.value }))}
                  className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter Alpha Vantage key for market data"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => toggleShowKey('alphaVantage')}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {showKeys.alphaVantage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => testAPIKey('alphaVantage', formData.alphaVantageKey)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Test API Key"
                  >
                    {testResults.alphaVantage === true ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : testResults.alphaVantage === false ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                For real-time stock market data in market analysis mode.
              </p>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Auto-refresh News</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically refresh news articles every 5 minutes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoRefresh}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show browser notifications for important market changes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              API keys are stored locally in your browser
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default APISettings;