// @ts-nocheck
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuickPoll - Real-Time Opinion Polling',
  description: 'Create and vote on polls in real-time',
};

const RootLayout = (props) => {
  const { children } = props;
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
};

export default RootLayout;
