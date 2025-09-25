'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { MarketAnalysis } from '../../types';

interface TrendChartProps {
  analysis: MarketAnalysis;
}

const TrendChart: React.FC<TrendChartProps> = ({ analysis }) => {
  // Generate mock trend data based on analysis
  const generateTrendData = () => {
    const baseValue = 100;
    const volatility = analysis.impactScore * 2;
    const trend = analysis.sentiment === 'bullish' ? 1 : analysis.sentiment === 'bearish' ? -1 : 0;
    
    return Array.from({ length: 30 }, (_, i) => {
      const randomFactor = (Math.random() - 0.5) * volatility;
      const trendFactor = trend * i * 0.5;
      const value = baseValue + trendFactor + randomFactor;
      
      return {
        day: `Day ${i + 1}`,
        value: Math.max(0, value),
        volume: Math.floor(Math.random() * 1000000) + 500000,
        sentiment: analysis.sentiment === 'bullish' ? 60 + Math.random() * 30 : 
                  analysis.sentiment === 'bearish' ? 20 + Math.random() * 30 : 
                  40 + Math.random() * 20
      };
    });
  };

  // Generate sector performance data
  const generateSectorData = () => {
    return analysis.sectors.map(sector => ({
      name: sector.name.length > 10 ? sector.name.substring(0, 10) + '...' : sector.name,
      score: sector.score,
      impact: sector.impact === 'positive' ? sector.score : sector.impact === 'negative' ? -sector.score : 0
    }));
  };

  const trendData = generateTrendData();
  const sectorData = generateSectorData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getSentimentColor = () => {
    switch (analysis.sentiment) {
      case 'bullish':
        return '#10b981'; // green
      case 'bearish':
        return '#ef4444'; // red
      default:
        return '#f59e0b'; // yellow
    }
  };

  const getBarColor = (value: number) => {
    if (value > 0) return '#10b981'; // green for positive
    if (value < 0) return '#ef4444'; // red for negative
    return '#f59e0b'; // yellow for neutral
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
        <BarChart3 className="w-5 h-5" />
        <span>Market Trend Analysis</span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Market Trend (30 Days)</span>
            </h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              analysis.sentiment === 'bullish' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : analysis.sentiment === 'bearish'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {analysis.sentiment.toUpperCase()}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getSentimentColor()} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={getSentimentColor()} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280" 
                fontSize={12}
                interval={4}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={getSentimentColor()}
                fillOpacity={1}
                fill="url(#colorTrend)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sector Performance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Sector Impact Scores</span>
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={12}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.impact)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Volume and Sentiment Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Market Volume & Sentiment Correlation
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280" 
              fontSize={12}
              interval={4}
            />
            <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="volume" fill="#3b82f6" opacity={0.3} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sentiment"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 opacity-60 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Volume</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Sentiment Score</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrendChart;