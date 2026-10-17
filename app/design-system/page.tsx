import type { Metadata } from 'next'
import { Showcase } from './Showcase'

export const metadata: Metadata = {
  title: 'Design system',
}

/**
 * Vitrine do design system (design-system/): todos os componentes, estados e os dois temas.
 * Fora de (protected) para não herdar o layout do CRM; o acesso segue a regra de login do proxy.
 */
export default function DesignSystemPage() {
  return <Showcase />
}
