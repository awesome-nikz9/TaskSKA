import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'TaskSKA - Task Management System',
  description: 'TaskSKA — world-standard task management with MFA, sprints, workload analytics and team collaboration. MIT 651/652 Capstone.',
  generator: 'TaskSKA',
}

export const viewport = {
  themeColor: '#3b5fc0',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
