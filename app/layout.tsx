import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { AssetNewsProvider } from './components/AssetNewsProvider';
import { SessionManager } from './components/layout/SessionManager';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NewsLens AI',
  description: 'Intelligent News Analysis',
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'NewsLens AI',
    capable: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased font-sans text-gray-900 dark:text-white min-h-screen relative
          bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50/50 to-purple-50
          dark:from-[#0B0C10] dark:via-[#1A1829] dark:to-[#0F1B2A]
      ">
        {/* Soft Aurora Mesh Overlays */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-300/10 dark:bg-blue-800/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        </div>
        <SessionManager />
        <AuthProvider>
          <AssetNewsProvider>
            {children}
            <Toaster position="bottom-right" />
          </AssetNewsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}