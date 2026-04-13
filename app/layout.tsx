import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/tms/Providers'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'TaskSKA - Task Management System',
  description: 'TaskSKA is the modern task management platform for teams. Create tasks, manage connections, track workloads, and collaborate seamlessly.',
  generator: 'TaskSKA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`} style={{ backgroundColor: "hsl(214,60%,97%)", colorScheme: "light" }}>
      <body className="font-sans antialiased" style={{ backgroundColor: "hsl(214,60%,97%)", color: "hsl(222,47%,11%)", margin: 0 }}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
