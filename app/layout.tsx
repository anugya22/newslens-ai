import type { Metadata } from 'next';
import './globals.css';  // Keep it as ./globals.css

export const metadata: Metadata = {
  title: 'NewsLens AI',
  description: 'Intelligent News Analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}