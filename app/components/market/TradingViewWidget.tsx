import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        TradingView: any;
    }
}

interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    autosize?: boolean;
    width?: string | number;
    height?: string | number;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
    symbol = 'NASDAQ:AAPL',
    theme = 'dark',
    autosize = true,
    width = '100%',
    height = 400,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView && containerRef.current) {
                new window.TradingView.widget({
                    container_id: containerRef.current.id,
                    width: autosize ? '100%' : width,
                    height: height,
                    symbol: symbol,
                    interval: 'D',
                    timezone: 'Etc/UTC',
                    theme: theme,
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#f1f3f6',
                    enable_publishing: false,
                    allow_symbol_change: true,
                    save_image: false,
                    hide_side_toolbar: false,
                });
            }
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script if needed, though usually fine to leave cached
            // document.head.removeChild(script); 
        };
    }, [symbol, theme, autosize, width, height]);

    const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;

    return (
        <div
            id={containerId}
            ref={containerRef}
            className="tradingview-widget-container w-full h-full rounded-xl overflow-hidden border border-white/10"
            style={{ height: height }} // Ensure container has height
        />
    );
};

export default TradingViewWidget;
