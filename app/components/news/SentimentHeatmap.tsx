'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NewsArticle } from '../../types';

interface SentimentHeatmapProps {
    news: NewsArticle[];
}

// Map keywords to sectors
const SECTOR_KEYWORDS: Record<string, string[]> = {
    'Technology': ['tech', 'software', 'ai', 'apple', 'microsoft', 'google', 'meta', 'nvidia'],
    'Finance': ['bank', 'finance', 'economy', 'fed', 'rate', 'inflation', 'stock', 'market'],
    'Crypto': ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'blockchain'],
    'Energy': ['oil', 'gas', 'energy', 'solar', 'wind', 'clean', 'green'],
    'Healthcare': ['health', 'fda', 'pharma', 'biotech', 'vaccine', 'medical'],
    'Consumer': ['retail', 'consumer', 'sales', 'amazon', 'walmart', 'store'],
};

export const SentimentHeatmap: React.FC<SentimentHeatmapProps> = ({ news }) => {
    const sectorData = useMemo(() => {
        const data: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {};

        // Initialize sectors
        Object.keys(SECTOR_KEYWORDS).forEach(sector => {
            data[sector] = { positive: 0, neutral: 0, negative: 0, total: 0 };
        });

        // Categorize news and tally sentiment
        news.forEach(article => {
            const text = `${article.title} ${article.description}`.toLowerCase();
            let assignedSector = 'Other';

            for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
                if (keywords.some(kw => text.includes(kw))) {
                    assignedSector = sector;
                    break;
                }
            }

            const sent = article.sentiment || 'neutral';
            if (!data[assignedSector]) {
                data[assignedSector] = { positive: 0, neutral: 0, negative: 0, total: 0 };
            }
            if (sent === 'positive') data[assignedSector].positive++;
            else if (sent === 'negative') data[assignedSector].negative++;
            else data[assignedSector].neutral++;
            data[assignedSector].total++;
        });

        return data;
    }, [news]);

    const sectors = Object.entries(sectorData)
        .filter(([_, stats]) => stats.total > 0)
        .sort((a, b) => b[1].total - a[1].total);

    if (sectors.length === 0) return null;

    return (
        <div className="w-full">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                Sector Sentiment Heatmap
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {sectors.map(([sector, stats], idx) => {
                    // Calculate net sentiment score (-1 to 1)
                    const netScore = stats.total > 0
                        ? (stats.positive - stats.negative) / stats.total
                        : 0;

                    // Determine color intensity based on score
                    let bgColor = 'bg-gray-100 dark:bg-gray-800'; // neutral default
                    let textColor = 'text-gray-700 dark:text-gray-300';

                    if (netScore > 0.3) {
                        bgColor = 'bg-green-500/20 dark:bg-green-500/30 border-green-500/50';
                        textColor = 'text-green-700 dark:text-green-400';
                    } else if (netScore < -0.3) {
                        bgColor = 'bg-red-500/20 dark:bg-red-500/30 border-red-500/50';
                        textColor = 'text-red-700 dark:text-red-400';
                    }

                    return (
                        <motion.div
                            key={sector}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-2 rounded-lg border ${bgColor} flex flex-col items-center justify-center text-center`}
                        >
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${textColor}`}>
                                {sector}
                            </span>
                            <div className="flex items-center space-x-1 mt-1 opacity-80">
                                {stats.positive > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                                {stats.neutral > 0 && <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                                {stats.negative > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                <span className={`text-[10px] ml-1 ${textColor}`}>
                                    {stats.total}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
