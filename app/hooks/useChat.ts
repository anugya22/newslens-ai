'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useStore } from '../lib/store';
import { useAuth } from '../context/AuthContext';
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
    news,
    sessionId
  } = useStore();
  const { user, session } = useAuth();

  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Extract recent history BEFORE we add the new empty messages
    const currentHistory = useStore.getState().messages.slice(-10).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

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

    // Prepare an empty AI message to stream into
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '', // Start empty
      timestamp: new Date().toISOString(),
    };
    addMessage(initialAiMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          marketMode: marketMode,
          cryptoMode: cryptoMode,
          sessionId: sessionId,
          userId: user?.id,
          accessToken: session?.access_token,
          history: currentHistory
        })
      });

      if (!response.ok) {
        let errMessage = 'Failed to get AI response';
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          errMessage = await response.text();
        }
        throw new Error(errMessage);
      }

      if (!response.body) throw new Error('ReadableStream not yet supported in this browser.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const data = JSON.parse(trimmedLine);
            if (data.type === 'metadata') {
              useStore.getState().updateMessage(aiMessageId, { marketAnalysis: data.data });
            } else if (data.type === 'content') {
              accumulatedContent += data.text;
              useStore.getState().updateMessage(aiMessageId, { content: accumulatedContent });
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunks that bypass the buffer
          }
        }
      }

    } catch (error: any) {
      console.error('Chat Error:', error);
      toast.error(error.message || 'The AI service is temporarily unavailable');

      useStore.getState().updateMessage(aiMessageId, {
        content: "I'm having trouble connecting to my brain right now. Please check your connection or try again in a few moments.",
      });
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [marketMode, cryptoMode, addMessage, setLoading]);

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

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(initialAiMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${message}\n\nPlease analyze this URL: ${url}`,
          marketMode: marketMode,
          cryptoMode: cryptoMode,
          sessionId: sessionId,
          userId: user?.id,
          accessToken: session?.access_token
        })
      });

      if (!response.ok) throw new Error('Failed to analyze URL');
      if (!response.body) throw new Error('Streaming not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            const data = JSON.parse(trimmedLine);
            if (data.type === 'content') {
              accumulatedContent += data.text;
              useStore.getState().updateMessage(aiMessageId, { content: accumulatedContent });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

    } catch (error) {
      console.error('URL Analysis Error:', error);
      toast.error('Failed to analyze URL');
      useStore.getState().updateMessage(aiMessageId, {
        content: "I'm having trouble analyzing this URL right now."
      });
    } finally {
      setLoading(false);
    }
  }, [marketMode, cryptoMode, addMessage, setLoading]);




  return {
    sendMessage,
    parseLink,
    isTyping,
  };
};
