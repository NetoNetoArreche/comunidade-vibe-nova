import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import PWARegister from '@/components/PWARegister'
import InstallPWA from '@/components/InstallPWA'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.comunidadevibecoding.com'),
  title: 'Vibe Coding',
  description: 'Uma comunidade moderna para desenvolvedores apaixonados por IA e programação',
  keywords: ['IA', 'programação', 'desenvolvimento', 'comunidade', 'tecnologia', 'vibe', 'coding'],
  authors: [{ name: 'Vibe Coding' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vibe Coding',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Vibe Coding',
    title: 'Vibe Coding - Comunidade',
    description: 'Uma comunidade moderna para desenvolvedores apaixonados por IA e programação',
  },
  twitter: {
    card: 'summary',
    title: 'Vibe Coding',
    description: 'Uma comunidade moderna para desenvolvedores apaixonados por IA e programação',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <PWARegister />
        <InstallPWA />
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
