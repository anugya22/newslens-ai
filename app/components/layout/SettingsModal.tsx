import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
    autoRefresh: settings.autoRefresh,
    notifications: settings.notifications,
  });



  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings saved successfully!');
    onClose();
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

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
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
                          className={`relative w-12 h-6 rounded-full transition-colors ${formData.autoRefresh ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          onClick={() =>
                            setFormData({ ...formData, autoRefresh: !formData.autoRefresh })
                          }
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
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
                          className={`relative w-12 h-6 rounded-full transition-colors ${formData.notifications ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          onClick={() =>
                            setFormData({ ...formData, notifications: !formData.notifications })
                          }
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.notifications ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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