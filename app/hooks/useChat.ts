'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useStore } from '../lib/store';
import { AI_CONFIG } from '../lib/config';
import { ChatMessage, MarketAnalysis } from '../types';
import toast from 'react-hot-toast';

export const useChatAPI = () => {
  const {
    addMessage,
    setLoading,
    settings,
    marketMode,
    cryptoMode,
    news
  } = useStore();

  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    setLoading(true);
    setIsTyping(true);

    try {
      // Call internal API route (keeps keys hidden)
      const response = await axios.post('/api/chat', {
        message: content,
        model: AI_CONFIG.MODEL, // Always use StepFun
        marketMode: marketMode,
        cryptoMode: cryptoMode
      });

      const { content: aiContent, marketAnalysis } = response.data;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
        marketAnalysis: marketAnalysis as MarketAnalysis | undefined
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error('Chat Error:', error);
      toast.error('Failed to get AI response. Please check your internet or API key.');

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting to the AI right now. Please check your API settings.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [settings.selectedModel, marketMode, cryptoMode, addMessage, setLoading]);

  const parseLink = useCallback(async (message: string, url: string) => {
    if (!url) return;

    setLoading(true);
    // Add user message with link
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      // Here we would ideally fetch the URL content content specifically
      // For now, we'll ask the AI to "read" it (some models can browse, others allow passing URL context)
      // Since we are using free models, we will simulate "reading" by passing the URL to the prompt
      // and hoping the model has knowledge or we would need a separate scraping service.
      // For a robust app, we'd use a server-side scraper.

      const response = await axios.post('/api/chat', {
        message: `${message}\n\nPlease analyze this URL: ${url}`,
        model: AI_CONFIG.MODEL, // Always use StepFun
        marketMode: marketMode
      });

      const analysis = response.data.content;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: analysis,
        timestamp: new Date().toISOString(),
      };

      addMessage(aiMessage);

    } catch (error) {
      console.error('URL Analysis Error:', error);
      toast.error('Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  }, [settings.selectedModel, marketMode, cryptoMode, addMessage, setLoading]);




  return {
    sendMessage,
    parseLink,
    isTyping,
  };
};
