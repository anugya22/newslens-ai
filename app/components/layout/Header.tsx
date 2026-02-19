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
  BarChart3,
  Wallet,
  Bitcoin,
  MessageCircle
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
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
    cryptoMode,
    setCryptoMode,
    sidebarOpen,
    setSidebarOpen
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const notifications: Notification[] = [];

  return (
    <>
      <motion.header
        className="fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-[100] backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Verified Clean: All merge conflicts resolved for Vercel deployment */}
          {/* Logo and Title */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                NewsLens AI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Intelligent News Analysis
              </p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant={marketMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<BarChart3 className="w-4 h-4" />}
              onClick={() => setMarketMode(!marketMode)}
              className={marketMode ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600' : ''}
            >
              Market Mode
            </Button>

            <Button
              variant={cryptoMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<Bitcoin className="w-4 h-4" />}
              onClick={() => setCryptoMode(!cryptoMode)}
              className={cryptoMode ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' : ''}
            >
              Crypto Advisory
            </Button>

            <div className="w-px h-6 bg-gray-200 dark:bg-white/20" />

            <Button
              variant="ghost"
              size="sm"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => {
                setMarketMode(false);
                setCryptoMode(false);
                router.push('/');
              }}
              className={pathname === '/' && !marketMode && !cryptoMode ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}
            >
              Chat
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={<Wallet className="w-4 h-4" />}
              onClick={() => router.push('/portfolio')}
              className={pathname === '/portfolio' ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}
            >
              Portfolio
            </Button>
          </div>

          <div className="flex items-center space-x-3">
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
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
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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

            <Button
              variant="ghost"
              size="sm"
              icon={settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              onClick={toggleTheme}
            />

            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setShowSettings(true)}
            />

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

        <div className="md:hidden px-6 pb-4 pt-2">
          <div className="flex space-x-2">
            <Button
              variant={marketMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<BarChart3 className="w-4 h-4" />}
              onClick={() => setMarketMode(!marketMode)}
              className="flex-1"
            >
              Market
            </Button>
            <Button
              variant={cryptoMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<Bitcoin className="w-4 h-4" />}
              onClick={() => setCryptoMode(!cryptoMode)}
              className="flex-1"
            >
              Crypto
            </Button>
            <Button
              variant={!marketMode && !cryptoMode ? 'primary' : 'ghost'}
              size="sm"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => {
                setMarketMode(false);
                setCryptoMode(false);
              }}
              className="flex-1"
            >
              Chat
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <APISettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

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
