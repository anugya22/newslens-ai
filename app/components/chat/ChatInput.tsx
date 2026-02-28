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

  const { isLoading, marketMode, cryptoMode, settings, pendingExplanation, setPendingExplanation } = useStore();
  const { sendMessage, parseLink } = useChatAPI();

  // Handle pending explanation from MarketAnalysis
  useEffect(() => {
    if (pendingExplanation) {
      setInput(pendingExplanation);
      setPendingExplanation(null); // Clear it after consuming
      textareaRef.current?.focus();
    }
  }, [pendingExplanation, setPendingExplanation]);

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
            className="flex items-center space-x-2 px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-sm text-gray-700 dark:text-gray-200"
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
            <div className="relative bg-white/70 dark:bg-gray-900/70 p-2 rounded-2xl border border-gray-200/50 dark:border-white/10 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-gray-800 transition-all duration-300 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  marketMode
                    ? "Ask about market news & stocks..."
                    : cryptoMode
                      ? "Ask for crypto advice & analysis..."
                      : "Message NewsLens AI..."
                }
                className="w-full px-4 py-3 pr-24 bg-transparent border-none outline-none resize-none max-h-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
                rows={1}
                disabled={isLoading}
              />

              {/* Input Actions - Moved to better position */}
              <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all duration-200 group relative"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-500 group-hover:text-primary-600 dark:text-gray-400 dark:group-hover:text-primary-400" />
                </button>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition-all duration-200 ${isRecording
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Character Count */}
            <div className="flex justify-between items-center mt-1 px-2">
              <span className="text-xs text-gray-400">
                {marketMode && (
                  <span className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Market Mode</span>
                  </span>
                )}
                {cryptoMode && (
                  <span className="inline-flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Crypto Advisory</span>
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
            className={`p-3 rounded-2xl transition-all duration-200 ${input.trim() && !isLoading
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
    </div>
  );
};

export default ChatInput;