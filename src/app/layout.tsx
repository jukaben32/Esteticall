import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'EstetiCall',
  description: 'Agentes de IA para spas médico-estéticos — información de tratamientos, citas y captura de leads en piloto automático.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
