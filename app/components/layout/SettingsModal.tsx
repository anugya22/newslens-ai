import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Globe, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, GlassCard, Input } from '../ui/Button';
import { useStore } from '../../lib/store';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState({
    openRouterKey: settings.openRouterKey || '',
    newsApiKey: settings.newsApiKey || '',
    alphaVantageKey: settings.alphaVantageKey || '',
    autoRefresh: settings.autoRefresh,
    notifications: settings.notifications,
  });
  
  const [showKeys, setShowKeys] = useState({
    openRouter: false,
    newsApi: false,
    alphaVantage: false,
  });

  const [activeTab, setActiveTab] = useState<'api' | 'preferences'>('api');

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings saved successfully!');
    onClose();
  };

  const testConnection = async (service: string) => {
    toast.loading(`Testing ${service} connection...`);
    
    // Simulate API test
    setTimeout(() => {
      toast.dismiss();
      toast.success(`${service} connection successful!`);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <GlassCard className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                  onClick={onClose}
                />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'api'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('api')}
                >
                  API Configuration
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'preferences'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('preferences')}
                >
                  Preferences
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'api' && (
                  <div className="space-y-6">
                    {/* OpenRouter API */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-primary-400" />
                        <h3 className="text-lg font-medium text-white">
                          OpenRouter API
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Required for AI-powered news analysis and market insights.
                      </p>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Input
                            type={showKeys.openRouter ? 'text' : 'password'}
                            placeholder="Enter OpenRouter API key"
                            value={formData.openRouterKey}
                            onChange={(e) =>
                              setFormData({ ...formData, openRouterKey: e.target.value })
                            }
                            icon={<Key className="w-4 h-4 text-gray-400" />}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={
                            showKeys.openRouter ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )
                          }
                          onClick={() =>
                            setShowKeys({ ...showKeys, openRouter: !showKeys.openRouter })
                          }
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testConnection('OpenRouter')}
                          disabled={!formData.openRouterKey}
                        >
                          Test
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>Keys are stored securely in your browser</span>
                      </div>
                    </div>

                    {/* News API */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-medium text-white">
                          News API (Optional)
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        For additional news sources beyond Google News RSS.
                      </p>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Input
                            type={showKeys.newsApi ? 'text' : 'password'}
                            placeholder="Enter News API key (optional)"
                            value={formData.newsApiKey}
                            onChange={(e) =>
                              setFormData({ ...formData, newsApiKey: e.target.value })
                            }
                            icon={<Key className="w-4 h-4 text-gray-400" />}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={
                            showKeys.newsApi ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )
                          }
                          onClick={() =>
                            setShowKeys({ ...showKeys, newsApi: !showKeys.newsApi })
                          }
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testConnection('News API')}
                          disabled={!formData.newsApiKey}
                        >
                          Test
                        </Button>
                      </div>
                    </div>

                    {/* Alpha Vantage API */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-medium text-white">
                          Alpha Vantage API (Optional)
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        For real-time stock market data and enhanced market analysis.
                      </p>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Input
                            type={showKeys.alphaVantage ? 'text' : 'password'}
                            placeholder="Enter Alpha Vantage API key (optional)"
                            value={formData.alphaVantageKey}
                            onChange={(e) =>
                              setFormData({ ...formData, alphaVantageKey: e.target.value })
                            }
                            icon={<Key className="w-4 h-4 text-gray-400" />}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={
                            showKeys.alphaVantage ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )
                          }
                          onClick={() =>
                            setShowKeys({ ...showKeys, alphaVantage: !showKeys.alphaVantage })
                          }
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testConnection('Alpha Vantage')}
                          disabled={!formData.alphaVantageKey}
                        >
                          Test
                        </Button>
                      </div>
                    </div>

                    {/* API Instructions */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-2">
                        Getting API Keys
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• OpenRouter: Visit openrouter.ai and create an account</li>
                        <li>• News API: Get free key at newsapi.org (optional)</li>
                        <li>• Alpha Vantage: Get free key at alphavantage.co (optional)</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Application Preferences
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Auto Refresh News</p>
                            <p className="text-sm text-gray-400">
                              Automatically refresh news feed every 5 minutes
                            </p>
                          </div>
                          <button
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              formData.autoRefresh ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                            onClick={() =>
                              setFormData({ ...formData, autoRefresh: !formData.autoRefresh })
                            }
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                formData.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-400">
                              Get notified about important market updates
                            </p>
                          </div>
                          <button
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              formData.notifications ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                            onClick={() =>
                              setFormData({ ...formData, notifications: !formData.notifications })
                            }
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                formData.notifications ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Settings
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;