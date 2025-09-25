'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3, PieChart, Activity } from 'lucide-react';
import { MarketAnalysis as MarketAnalysisType } from '../../types';
import TrendChart from './TrendChart';
import RiskAssessment from './RiskAssessment';

interface MarketAnalysisProps {
  analysis: MarketAnalysisType;
  isVisible: boolean;
  onClose: () => void;
}

const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ analysis, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800';
      case 'bearish':
        return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800';
      default:
        return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

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
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl border ${getSentimentColor(analysis.sentiment)}`}>
                {getSentimentIcon(analysis.sentiment)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Market Analysis
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive market impact assessment
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
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Sentiment</span>
                </div>
                <p className={`text-2xl font-bold capitalize ${getSentimentColor(analysis.sentiment).split(' ')[0]}`}>
                  {analysis.sentiment}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Impact Score</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysis.impactScore}/10
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Confidence</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.confidence}%
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Risk Level</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {analysis.risks.length > 0 ? analysis.risks[0].severity.toUpperCase() : 'LOW'}
                </p>
              </motion.div>
            </div>

            {/* Prediction */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Market Prediction</span>
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.prediction}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sector Analysis */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Sector Impact</span>
                </h3>
                <div className="space-y-3">
                  {analysis.sectors.map((sector, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {sector.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {sector.impact === 'positive' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : sector.impact === 'negative' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <Activity className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="font-semibold">{sector.score.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {sector.reasoning}
                      </p>
                      
                      {/* Stock Impacts */}
                      {sector.stocks && sector.stocks.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Key Stocks:
                          </h5>
                          {sector.stocks.slice(0, 3).map((stock, stockIndex) => (
                            <div
                              key={stockIndex}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                              <div>
                                <span className="font-medium text-sm">{stock.symbol}</span>
                                <span className="text-xs text-gray-500 ml-2">{stock.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-sm font-medium ${
                                    stock.predictedChange > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {stock.predictedChange > 0 ? '+' : ''}{stock.predictedChange.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-400">
                                  {stock.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Risk Assessment */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <RiskAssessment risks={analysis.risks} />
              </motion.div>
            </div>

            {/* Opportunities */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 p-6 rounded-xl border border-green-200 dark:border-green-800"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Investment Opportunities</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.opportunities.map((opportunity, index) => (
                  <div
                    key={index}
                    className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg border border-green-200/50 dark:border-green-800/50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {opportunity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Chart Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <TrendChart analysis={analysis} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MarketAnalysis;