'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic, Square, Link, TrendingUp } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useChatAPI } from '../../hooks/useChat';
import toast from 'react-hot-toast';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isLoading, marketMode, settings } = useStore();
  const { sendMessage, parseLink } = useChatAPI();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!settings.openRouterKey) {
      toast.error('Please configure your OpenRouter API key in settings');
      return;
    }

    const message = input.trim();
    setInput('');
    
    // Check if input contains a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);
    
    try {
      if (urls && urls.length > 0) {
        // Parse link and send message
        await parseLink(message, urls[0]);
      } else {
        // Regular chat message
        await sendMessage(message);
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      // Handle file upload logic here
      toast.success(`File "${files[0].name}" uploaded successfully`);
      // You can implement file processing logic
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic
      toast.success('Recording stopped');
    } else {
      setIsRecording(true);
      // Start recording logic
      toast.success('Recording started');
    }
  };

  const insertSampleQuery = (query: string) => {
    setInput(query);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Latest Tech News', icon: TrendingUp, query: "What's the latest technology news?" },
          { label: 'Market Analysis', icon: TrendingUp, query: "Analyze current market trends" },
          { label: 'Parse Link', icon: Link, query: "Analyze this article: " },
        ].map((action, index) => (
          <motion.button
            key={index}
            onClick={() => insertSampleQuery(action.query)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-full border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <action.icon className="w-3 h-3" />
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3">
          {/* Main Input Area */}
          <div className="flex-1 relative">
            <div className="relative bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  marketMode 
                    ? "Ask about news for market analysis..." 
                    : "Share a news link or ask about current events..."
                }
                className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none max-h-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                disabled={isLoading}
              />
              
              {/* Input Actions */}
              <div className="absolute right-2 top-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Character Count */}
            <div className="flex justify-between items-center mt-1 px-2">
              <span className="text-xs text-gray-400">
                {marketMode && (
                  <span className="inline-flex items-center space-x-1 text-accent-600 dark:text-accent-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Market Mode</span>
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-400">
                {input.length}/2000
              </span>
            </div>
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-2xl transition-all duration-200 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </form>

      {/* Loading Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-2"
        >
          <div className="flex items-center space-x-2 text-primary-500">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
            <span className="text-sm ml-2">
              {marketMode ? 'Analyzing market impact...' : 'Processing news...'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatInput;