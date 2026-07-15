import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Plus_Jakarta_Sans, Geist } from 'next/font/google'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: {
    default: 'VoxAgent — White-label AI Voice Platform',
    template: '%s | VoxAgent',
  },
  description: 'Launch your AI calling agency with white-label AI voice agents. Automate calls, book appointments, and scale your business.',
  openGraph: {
    title: 'VoxAgent — White-label AI Voice Platform',
    description: 'Launch your AI calling agency with white-label AI voice agents.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(222 47% 10%)',
              border: '1px solid hsl(222 47% 18%)',
              color: 'hsl(213 31% 91%)',
            },
          }}
        />
      </body>
    </html>
  )
}
