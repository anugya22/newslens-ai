'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, TrendingDown, Zap, Activity } from 'lucide-react';
import { RiskFactor } from '../../types';

interface RiskAssessmentProps {
  risks: RiskFactor[];
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ risks }) => {
  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Zap className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800';
      default:
        return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800';
    }
  };

  const getRiskBgGradient = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/30';
      case 'medium':
        return 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30';
      default:
        return 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30';
    }
  };

  // Calculate overall risk score
  const calculateOverallRisk = () => {
    if (risks.length === 0) return { score: 0, level: 'low' };
    
    const totalProbability = risks.reduce((sum, risk) => {
      const severityMultiplier = risk.severity === 'high' ? 3 : risk.severity === 'medium' ? 2 : 1;
      return sum + (risk.probability * severityMultiplier);
    }, 0);
    
    const averageRisk = totalProbability / (risks.length * 3); // Normalize to 0-1
    
    if (averageRisk > 0.7) return { score: averageRisk, level: 'high' };
    if (averageRisk > 0.4) return { score: averageRisk, level: 'medium' };
    return { score: averageRisk, level: 'low' };
  };

  const overallRisk = calculateOverallRisk();

  // Group risks by severity
  const groupedRisks = risks.reduce((acc, risk) => {
    if (!acc[risk.severity]) acc[risk.severity] = [];
    acc[risk.severity].push(risk);
    return acc;
  }, {} as Record<string, RiskFactor[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Risk Assessment</span>
        </h3>
        
        {/* Overall Risk Score */}
        <div className={`px-4 py-2 rounded-full border ${getRiskColor(overallRisk.level)}`}>
          <div className="flex items-center space-x-2">
            {getRiskIcon(overallRisk.level)}
            <span className="font-semibold">
              {overallRisk.level.toUpperCase()} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Risk Meter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Risk Level</span>
          <span className="text-sm font-bold">{(overallRisk.score * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallRisk.score * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-3 rounded-full ${
              overallRisk.level === 'high' 
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : overallRisk.level === 'medium'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </motion.div>

      {/* Risk Categories */}
      {risks.length > 0 ? (
        <div className="space-y-4">
          {['high', 'medium', 'low'].map((severity) => {
            const severityRisks = groupedRisks[severity];
            if (!severityRisks || severityRisks.length === 0) return null;

            return (
              <motion.div
                key={severity}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-gradient-to-r ${getRiskBgGradient(severity)} p-4 rounded-xl border border-gray-200 dark:border-gray-700`}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  {getRiskIcon(severity)}
                  <span className="capitalize">{severity} Risk Factors</span>
                  <span className="text-sm bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded-full">
                    {severityRisks.length}
                  </span>
                </h4>
                
                <div className="space-y-3">
                  {severityRisks.map((risk, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {risk.type}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Activity className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(risk.probability * 100).toFixed(0)}% chance
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {risk.description}
                          </p>
                        </div>
                        
                        {/* Probability Indicator */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 relative">
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray={`${risk.probability * 100}, 100`}
                                className={
                                  severity === 'high' 
                                    ? 'text-red-500'
                                    : severity === 'medium'
                                    ? 'text-yellow-500'
                                    : 'text-green-500'
                                }
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-gray-200 dark:text-gray-700"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {(risk.probability * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 p-8 rounded-xl border border-green-200 dark:border-green-800 text-center"
        >
          <Shield className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Low Risk Profile
          </h4>
          <p className="text-gray-700 dark:text-gray-300">
            No significant risk factors identified based on current market analysis.
          </p>
        </motion.div>
      )}

      {/* Risk Mitigation Recommendations */}
      {risks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Risk Mitigation Strategies</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Diversify portfolio across multiple sectors",
              "Set stop-loss orders at appropriate levels",
              "Monitor news and market sentiment regularly",
              "Consider hedging strategies for high-risk positions",
              "Maintain adequate cash reserves for opportunities",
              "Review and adjust positions based on risk tolerance"
            ].map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {strategy}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RiskAssessment;