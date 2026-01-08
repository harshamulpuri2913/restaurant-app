import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import dynamic from 'next/dynamic'

import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'Sai Datta Snacks & Savories',
  description: 'Authentic homemade Andhra snacks, sweets, and traditional pickles',
  keywords: ['Indian snacks', 'Andhra snacks', 'traditional pickles', 'homemade sweets'],
  authors: [{ name: 'Sai Datta Snacks & Savories' }],
  openGraph: {
    title: 'Sai Datta Snacks & Savories',
    description: 'Authentic homemade Andhra snacks, sweets, and traditional pickles',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}

