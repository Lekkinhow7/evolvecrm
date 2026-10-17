import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next'
import { Onest, Pixelify_Sans } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { InstallBanner } from '@/components/pwa/InstallBanner'

// Fontes do design system (DESIGN.md): Onest em tudo, Pixelify Sans só para números de KPI.
const onest = Onest({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-onest', display: 'swap' })
const pixelify = Pixelify_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-pixelify', display: 'swap' })

export const metadata: Metadata = {
  title: `${CRM_NAME}`,
  description: 'CRM Inteligente para Gestão de Vendas',
}

/**
 * Componente React `RootLayout`.
 *
 * @param {{ children: ReactNode; }} {
  children,
} - Parâmetro `{
  children,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: necessário porque a classe "dark" é aplicada no servidor mas pode ser sobrescrita por tema do sistema no cliente
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${onest.variable} ${pixelify.variable} font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text-primary)]`}>
        <ServiceWorkerRegister />
        <InstallBanner />
        {children}
      </body>
    </html>
  )
}
