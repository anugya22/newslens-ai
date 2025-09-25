import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Sun, 
  Moon, 
  TrendingUp, 
  MessageSquare, 
  Bell,
  Menu,
  X,
  BarChart3
} from 'lucide-react';
import { Button, GlassCard } from '../ui/Button';
import { useStore } from '../../lib/store';
import APISettings from '../Settings/APISettings';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
}

const Header: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    marketMode, 
    setMarketMode,
    sidebarOpen,
    setSidebarOpen
  } = useStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Empty notifications array - in production, these would come from real data
  const notifications: Notification[] = [];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-white/10"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                NewsLens AI
              </h1>
              <p className="text-xs text-gray-400">
                Intelligent News Analysis
              </p>
            </div>
          </motion.div>

          {/* Center Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant={marketMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<BarChart3 className="w-4 h-4" />}
              onClick={() => setMarketMode(!marketMode)}
            >
              Market Mode
            </Button>
            
            <div className="w-px h-6 bg-white/20" />
            
            <Button
              variant="ghost"
              size="sm"
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Chat
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Notifications - Only show if there are real notifications */}
            {notifications.length > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Bell className="w-4 h-4" />}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 w-80 z-[60]"
                  >
                    <GlassCard className="p-4">
                      <h3 className="text-sm font-medium text-white mb-3">
                        Notifications
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              icon={settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              onClick={toggleTheme}
            />

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setShowSettings(true)}
            />

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                icon={sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Mode Selector */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex space-x-2">
            <Button
              variant={marketMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<BarChart3 className="w-4 h-4" />}
              onClick={() => setMarketMode(!marketMode)}
              className="flex-1"
            >
              Market Mode
            </Button>
            <Button
              variant={!marketMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => setMarketMode(false)}
              className="flex-1"
            >
              News Mode
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <APISettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

export default Header;